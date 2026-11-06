"""Run with: hermes --run-module pdb -c continue -c quit scripts/validate-hermes.py integration/hermes
(The debugger completion banner is not a service restart.)
Loads ONLY this plugin for this short-lived validation process. Does not change
plugins.enabled, user preferences, or restart any running host service.
"""
import json
from pathlib import Path
import sys
from hermes_cli.plugins import PluginManager, PluginContext
from hermes_cli.plugins_manifest import parse_manifest_file
from tools.registry import registry

root=Path(sys.argv[1]).resolve()
manifest=parse_manifest_file(root/'plugin.yaml',root,'user','')
assert manifest is not None
manager=PluginManager()
manager._load_plugin(manifest)
loaded=manager._plugins[manifest.name]
assert loaded.enabled and not loaded.error, loaded.error
assert registry.get_entry('poptart_studio',scope=manager.scope_key) is not None
ctx=PluginContext(manifest,manager)
def call(op,**input):
    raw=ctx.dispatch_tool('poptart_studio',{'op':op,'input':input})
    result=json.loads(raw) if isinstance(raw,str) else raw
    assert 'ok' in result, result
    return result
track=call('create',title='Hermes native validation',code='s("bd*4")',tempo=120,sections=[])
assert track['ok'],track
tid=track['data']['id']
snapshot=call('snapshot',trackId=tid,expectedRevision=1)
assert snapshot['ok'],snapshot
assert call('update',trackId=tid,expectedRevision=1,changes={'title':'Native revised'})['ok']
assert call('update',trackId=tid,expectedRevision=1,changes={'title':'stale'})['code']=='CONFLICT'
restored=call('restore',trackId=tid,snapshotId=snapshot['data']['id'],expectedRevision=2)
assert restored['ok'] and restored['data']['revision']==3,restored
assert call('get',trackId=tid)['data']['title']=='Hermes native validation'
assert call('export',trackId=tid)['data']['code']=='s("bd*4")'
assert call('analyze',trackId=tid)['data']['audio'] is None
assert call('snapshots',trackId=tid)['ok']
assert call('sections',trackId=tid)['ok']
assert call('update_section',trackId=tid,expectedRevision=3,sectionId='intro',section={'name':'Intro','code':'silence'})['data']['revision']==4
assert call('list')['ok']
assert call('list',extra=True)['code']=='VALIDATION_ERROR'
from plugins.plugin_storage import plugin_data_dir
directory=plugin_data_dir(manifest.name)
state=json.loads((directory/'service.json').read_text())
assert (directory/'service.token').stat().st_mode & 0o777==0o600
import urllib.request,urllib.error
req=urllib.request.Request(f"http://127.0.0.1:{state['port']}/api/tool",data=b'{"operation":"track.list","input":{}}',headers={'Content-Type':'application/json'})
try: urllib.request.urlopen(req);raise AssertionError('Unauthenticated access allowed')
except urllib.error.HTTPError as e: assert e.code==401
# Exercise the exact backend router without mounting/enabling it in a running dashboard.
import importlib.util
from fastapi import FastAPI
from fastapi.testclient import TestClient
spec=importlib.util.spec_from_file_location('poptart_api_validation',root/'dashboard/plugin_api.py')
api=importlib.util.module_from_spec(spec);spec.loader.exec_module(api)
app=FastAPI();app.include_router(api.router)
with TestClient(app) as client:
    bootstrap=client.get('/bootstrap').json()
    assert bootstrap['transport']=='hermes-origin-v2' and 'studioUrl' not in bootstrap
    assert 'poptart-guest' in bootstrap['document']
    assert client.post('/tool',json={'op':'get','input':{'trackId':tid}}).json()['ok']
    assert client.post('/tool',json={'op':'list','input':{},'extra':True}).status_code==422
print(json.dumps({'backendRouter':True,'nativeRegistration':True,'hermesDispatch':True,'operations':11,'conflict':True,'strictValidation':True,'unauthenticatedStatus':401,'tokenMode':'0600','trackId':tid,'dataDir':str(directory),'service':state}))
# Do not kill/restart the new detached Node sidecar; it remains available for the pane.
manager.unload()
