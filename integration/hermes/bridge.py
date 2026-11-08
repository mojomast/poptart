"""Authenticated local sidecar. No process/network activity during registration."""
from contextlib import contextmanager
try:
    import fcntl
except ImportError:  # Windows
    fcntl = None
try:
    import msvcrt
except ImportError:  # POSIX
    msvcrt = None
import inspect
import json
import os
from pathlib import Path
import secrets
import queue
import threading
import subprocess
import urllib.request

NAME = 'hermes-strudel-studio'
ROOT = Path(__file__).resolve().parent
OPS = {'list':'track.list', 'get':'track.get', 'create':'track.create', 'update':'track.update',
       'snapshot':'snapshot.create', 'snapshots':'snapshot.list', 'restore':'snapshot.restore',
       'analyze':'analyze_track', 'export':'export_track', 'sections':'list_sections', 'update_section':'update_section'}
ID = {'type':'string','pattern':'^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$'}
TEXT = {'type':'string','maxLength':100000}
LABEL = {'type':'string','minLength':1,'maxLength':200,'pattern':r'\S'}
REV = {'type':'integer','minimum':1,'maximum':9007199254740991}

def obj(props, required=None):
    return {'type':'object','properties':props,'required':list(props) if required is None else required,'additionalProperties':False}

SECTION = obj({'id':ID,'name':LABEL,'code':TEXT})
FIELDS = {'title':LABEL,'code':TEXT,'tempo':{'type':'number','minimum':20,'maximum':400},
          'sections':{'type':'array','items':SECTION,'maxItems':500}}
INPUTS = {op:obj({'trackId':ID}) for op in ['get','snapshots','analyze','export','sections']}
INPUTS.update(list=obj({}), create=obj(FIELDS), update=obj({'trackId':ID,'expectedRevision':REV,'changes':{**obj(FIELDS,[]),'minProperties':1}}),
    snapshot=obj({'trackId':ID,'expectedRevision':REV}), restore=obj({'trackId':ID,'snapshotId':ID,'expectedRevision':REV}),
    update_section=obj({'trackId':ID,'expectedRevision':REV,'sectionId':ID,'section':obj({'name':LABEL,'code':TEXT})}))
SCHEMA = {'name':'poptart_studio','description':'Compose saved Strudel tracks. Read current revision before writes; snapshot risky edits. Does not execute code, start playback, or export audio. User starts Play/apply in the pane.',
          'parameters':obj({'op':{'type':'string','enum':list(OPS)}, 'input':{'type':'object','description':'Fields depend on op; see bundled strudel-studio skill.'}})}
OUTPUT = {'type':'object','properties':{'ok':{'type':'boolean'},'data':{},'error':{'type':['string','null']},'code':{'type':['string','null']},'fix':{'type':['string','null']}},'required':['ok','error','code','fix']}

def failure(code, error, fix):
    return {'ok':False,'error':error,'code':code,'fix':fix}


def data_dir():
    from plugins.plugin_storage import plugin_data_dir
    return plugin_data_dir(NAME)


def _request(port, token, request):
    req = urllib.request.Request(f'http://127.0.0.1:{port}/api/tool',data=json.dumps(request).encode(),
        headers={'Content-Type':'application/json','Authorization':'Bearer '+token},method='POST')
    # Explicitly bypass ambient proxy settings; never send this token off loopback.
    with urllib.request.build_opener(urllib.request.ProxyHandler({})).open(req,timeout=8) as response:
        return json.load(response)


@contextmanager
def startup_lock(path):
    """Serialize first startup across processes on POSIX and Windows; fail closed."""
    with path.open('a+b') as lock:
        if fcntl is not None:
            fcntl.flock(lock, fcntl.LOCK_EX)
        elif msvcrt is not None:
            # msvcrt locks a byte range; seed the file and always lock byte zero.
            lock.seek(0, os.SEEK_END)
            if lock.tell() == 0:
                lock.write(b'\0')
                lock.flush()
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_LOCK, 1)
        else:
            raise RuntimeError('No supported interprocess startup lock available')
        try:
            yield
        finally:
            if fcntl is not None:
                fcntl.flock(lock, fcntl.LOCK_UN)
            else:
                lock.seek(0)
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)


def connection():
    directory = data_dir()
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    with startup_lock(directory / 'startup.lock'):
        token_file = directory / 'service.token'
        try:
            fd = os.open(token_file,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        except FileExistsError:
            pass
        else:
            with os.fdopen(fd,'w') as stream: stream.write(secrets.token_hex(32))
        info = token_file.lstat()
        # Windows has no POSIX uid/mode bits; rely on the profile directory ACL.
        insecure_posix = os.name != 'nt' and (info.st_uid != os.getuid() or info.st_mode & 0o777 != 0o600)
        if token_file.is_symlink() or not token_file.is_file() or insecure_posix:
            raise RuntimeError('Service token file must be owner-owned regular mode 0600')
        token = token_file.read_text()
        if len(token)!=64 or any(c not in '0123456789abcdef' for c in token): raise RuntimeError('Invalid service token file')
        state_file = directory / 'service.json'
        if state_file.exists():
            state = json.loads(state_file.read_text())
            port = state['port']
            if type(port) is not int or not 1024 <= port <= 65535: raise RuntimeError('Invalid service port')
            # Never auto-restart a previously started service. Operator approval required.
            _request(port,token,{'operation':'track.list','input':{}})
            return port, token
        service = ROOT / 'service' / 'index.js'
        if not service.is_file() or not (ROOT/'guest-document.html').is_file():
            raise RuntimeError('Incomplete plugin package; reinstall from the catalog or regenerate with npm run build')
        # Minimal environment: do not inherit host provider keys into the sidecar.
        env = {key:os.environ[key] for key in ['PATH','HOME','LANG','SystemRoot','WINDIR','TEMP','TMP'] if key in os.environ}
        env.update(PORT='0', POPTART_TOKEN_FILE=str(token_file),POPTART_DATA_FILE=str(directory/'tracks.json'))
        # Persist a starting marker first: failed/uncertain startup never silently spawns a second owner.
        fd = os.open(state_file,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as stream: json.dump({'port':None,'status':'starting'},stream)
        log_fd = os.open(directory/'service.log',os.O_WRONLY|os.O_APPEND|os.O_CREAT,0o600)
        with os.fdopen(log_fd,'ab') as log:
            process = subprocess.Popen(['node',str(service)],env=env,cwd=directory,stdout=subprocess.PIPE,stderr=log,start_new_session=True)
        # Windows select() cannot wait on subprocess pipes. A bounded reader
        # thread works on both platforms; a timeout retains the starting marker.
        ready = queue.Queue(maxsize=1)
        def read_ready():
            try:
                ready.put(process.stdout.readline(4096))
            finally:
                process.stdout.close()
        threading.Thread(target=read_ready, daemon=True).start()
        try:
            line = ready.get(timeout=10)
        except queue.Empty:
            raise RuntimeError('Service startup timed out; inspect private service.log') from None
        state = {'port':json.loads(line)['port'],'pid':process.pid}
        temporary = directory/'service.json.tmp'
        fd = os.open(temporary,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as stream: json.dump(state,stream)
        temporary.replace(state_file)
        return state['port'],token


def invoke(args, **kwargs):
    try:
        if len(json.dumps(args,allow_nan=False).encode('utf8')) > 1024*1024: raise ValueError('Request too large')
        from jsonschema import Draft202012Validator
        Draft202012Validator(SCHEMA['parameters']).validate(args)
        Draft202012Validator(INPUTS[args['op']]).validate(args['input'])
        sections = args['input'].get('sections',args['input'].get('changes',{}).get('sections',[]))
        if len({s['id'] for s in sections}) != len(sections): raise ValueError('Section IDs must be unique')
    except Exception:
        return json.dumps(failure('VALIDATION_ERROR','Invalid operation or fields','Use the exact per-op fields in hermes-strudel-studio:strudel-studio; unknown fields are rejected.'))
    try:
        port,token = connection()
        result = _request(port,token,{'operation':OPS[args['op']],'input':args['input']})
        if result['ok']: result.update(error=None,code=None,fix=None)
        else:
            error = result['error']
            result = failure(error['code'],error['message'],'Read the latest revision and preserve unsaved edits.' if error['code']=='CONFLICT' else 'Check the track ID and per-op fields; retry only after correcting them.')
        return json.dumps(result)
    except Exception:
        # Never include HTTP headers, environment or secret-bearing exception details.
        return json.dumps(failure('SERVICE_UNAVAILABLE','Local music service is unavailable','Check build, Node and private plugin-data/service.log. If previously started, obtain approval before any service restart.'))


def register(ctx):
    options = dict(name='poptart_studio',toolset='poptart',schema=SCHEMA,handler=invoke)
    if 'output_schema' in inspect.signature(ctx.register_tool).parameters: options['output_schema']=OUTPUT
    ctx.register_tool(**options)
    ctx.register_skill('strudel-studio', ROOT/'skills'/'strudel-studio'/'SKILL.md')
