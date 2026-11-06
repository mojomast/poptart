import importlib.util
import json
from pathlib import Path
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT=Path(__file__).resolve().parents[2]/'integration/hermes'

def test_authenticated_bootstrap_never_returns_sidecar_url_or_token():
    spec=importlib.util.spec_from_file_location('poptart_document_test',ROOT/'dashboard/plugin_api.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    app=FastAPI();app.include_router(module.router)
    sentinel='test-service-credential-must-not-reach-guest'
    with patch.object(module.bridge,'connection',return_value=(46691,sentinel)),TestClient(app) as client:
        data=client.get('/bootstrap').json()
    assert data['ok'] and data['transport']=='hermes-origin-v2'
    assert 'studioUrl' not in data
    serialized=json.dumps(data)
    assert sentinel not in serialized
    assert '127.0.0.1:46691' not in serialized
    assert 'audioHtml' in data['document'] and 'data:audio/wav' in data['document']  # bundled static samples, no guest HTTP fetch
    assert 'poptart-guest' in data['document']
    assert len(data['sha256'])==64

def test_versioned_entrypoint_preserves_namespace_routes():
    spec=importlib.util.spec_from_file_location('poptart_v2_test',ROOT/'dashboard/plugin_api_v2.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    assert sorted(route.path for route in module.router.routes)==['/bootstrap','/tool']
    manifest=json.loads((ROOT/'dashboard/manifest.json').read_text())
    assert manifest['api']=='plugin_api_v2.py'
