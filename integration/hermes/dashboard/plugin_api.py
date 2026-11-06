"""Hermes authenticates/gates this namespace. No sidecar token reaches the renderer."""
import importlib.util
import json
from pathlib import Path
from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict

# Dashboard loads API modules by file, outside the native package namespace.
spec = importlib.util.spec_from_file_location('poptart_backend_bridge', Path(__file__).resolve().parents[1]/'bridge.py')
bridge = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bridge)
router = APIRouter()

class Request(BaseModel):
    model_config = ConfigDict(extra='forbid')
    op: str
    input: dict

@router.get('/bootstrap')
def bootstrap():
    try:
        port, _ = bridge.connection()
        return {'ok':True,'studioUrl':f'http://127.0.0.1:{port}/player'}
    except Exception:
        return bridge.failure('SERVICE_UNAVAILABLE','Studio unavailable','Build first; inspect private sidecar log. Ask before restarting an existing service.')

@router.post('/tool')
def tool(request: Request):
    return json.loads(bridge.invoke(request.model_dump()))
