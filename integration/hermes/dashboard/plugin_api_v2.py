"""Versioned entrypoint: existing Hermes wildcard proxy loads this fresh ASGI app.
Hermes v0.22.7 caches ASGI apps by API-file path, not file mtime.
"""
import importlib.util
from pathlib import Path
spec = importlib.util.spec_from_file_location('poptart_origin_api_v2',Path(__file__).with_name('plugin_api.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
router = module.router
