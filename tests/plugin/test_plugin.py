import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('poptart_test_bridge',ROOT/'integration/hermes/bridge.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)

class FakeCtx:
    def __init__(self): self.tools = []; self.skills = []
    def register_tool(self, *, name, toolset, schema, handler): self.tools.append((name,handler))
    def register_skill(self, name, path): self.skills.append((name,path))

class NewCtx(FakeCtx):
    def register_tool(self, *, name, toolset, schema, handler, output_schema):
        self.output = output_schema
        self.tools.append((name,handler))

class PluginTests(unittest.TestCase):
    def test_registration_signature_gate(self):
        for cls in [FakeCtx,NewCtx]:
            ctx = cls(); bridge.register(ctx)
            self.assertEqual([x[0] for x in ctx.tools],['poptart_studio'])
            self.assertEqual(ctx.skills[0][0],'strudel-studio')
        self.assertEqual(NewCtx().tools,[])

    def test_strict_validation_before_network(self):
        invalid = [None,{}, {'op':'create','input':{'title':'x','code':'silence','tempo':float('nan'),'sections':[]}}, {'op':'delete','input':{}},{'op':'list','input':{'extra':1}},
                   {'op':'get','input':{'trackId':'../bad'}}, {'op':'snapshot','input':{'trackId':'abc','expectedRevision':True}},
                   {'op':'update','input':{'trackId':'abc','expectedRevision':1,'changes':{}}},
                   {'op':'create','input':{'title':'x','code':'silence','tempo':120,'sections':[{'id':'a','name':'a','code':'','extra':1}]}},
                   {'op':'list','input':{},'extra':1}]
        with patch.object(bridge,'connection',side_effect=AssertionError('network called')):
            for args in invalid:
                self.assertEqual(json.loads(bridge.invoke(args))['code'],'VALIDATION_ERROR',args)

    def test_all_operation_inputs(self):
        from jsonschema import Draft202012Validator
        fields = dict(title='test',code='silence',tempo=120,sections=[])
        cases = dict(list={},get={'trackId':'a'},create=fields,update={'trackId':'a','expectedRevision':1,'changes':{'code':'x'}},
            snapshot={'trackId':'a','expectedRevision':1},snapshots={'trackId':'a'},restore={'trackId':'a','snapshotId':'b','expectedRevision':1},
            analyze={'trackId':'a'},export={'trackId':'a'},sections={'trackId':'a'},update_section={'trackId':'a','expectedRevision':1,'sectionId':'b','section':{'name':'a','code':'x'}})
        for op,inp in cases.items(): Draft202012Validator(bridge.INPUTS[op]).validate(inp)
        self.assertEqual(set(cases),set(bridge.OPS))

    def test_existing_service_is_never_auto_restarted(self):
        with tempfile.TemporaryDirectory() as d, patch.object(bridge,'data_dir',return_value=Path(d)):
            (Path(d)/'service.json').write_text('{"port":12345}')
            with patch.object(bridge,'_request',side_effect=ConnectionError), patch.object(bridge.subprocess,'Popen') as spawn:
                result=json.loads(bridge.invoke({'op':'list','input':{}}))
                self.assertEqual(result['code'],'SERVICE_UNAVAILABLE')
                spawn.assert_not_called()

    def test_real_sidecar_workflow(self):
        with tempfile.TemporaryDirectory() as d, patch.object(bridge,'data_dir',return_value=Path(d)):
            def call(op, **inp): return json.loads(bridge.invoke({'op':op,'input':inp}))
            self.assertEqual(call('list')['data'],[])
            state=json.loads((Path(d)/'service.json').read_text())
            try:
                self.assertEqual((Path(d)/'service.token').stat().st_mode & 0o777,0o600)
                made=call('create',title='Hermes test',code='s("bd*4")',tempo=120,sections=[])
                self.assertTrue(made['ok'],made); track=made['data']; tid=track['id']
                snap=call('snapshot',trackId=tid,expectedRevision=1)['data']
                self.assertTrue(call('update',trackId=tid,expectedRevision=1,changes={'title':'Revised'})['ok'])
                self.assertEqual(call('update',trackId=tid,expectedRevision=1,changes={'title':'Stale'})['code'],'CONFLICT')
                self.assertEqual(call('restore',trackId=tid,snapshotId=snap['id'],expectedRevision=2)['data']['revision'],3)
                self.assertEqual(call('get',trackId=tid)['data']['title'],'Hermes test')
                self.assertEqual(call('analyze',trackId=tid)['data']['audio'],None)
                self.assertEqual(call('export',trackId=tid)['data']['code'],track['code'])
                self.assertEqual(call('snapshots',trackId=tid)['data'][0]['id'],snap['id'])
                # Public assets work for opaque guests; API does not.
                import urllib.request, urllib.error
                url=f"http://127.0.0.1:{state['port']}"
                # Hermes serves the guest over its authenticated bootstrap, not sidecar HTTP.
                with self.assertRaises(urllib.error.HTTPError) as missing:
                    urllib.request.urlopen(url+'/player')
                self.assertEqual(missing.exception.code,404)
                with urllib.request.urlopen(url+'/assets/../service.token') as r: self.fail('Traversal allowed')
            except urllib.error.HTTPError as e:
                self.assertEqual(e.code,404)
            finally:
                # Test fixture process only: not a host service restart.
                import os, signal
                os.kill(state['pid'],signal.SIGTERM)

if __name__ == '__main__': unittest.main()
