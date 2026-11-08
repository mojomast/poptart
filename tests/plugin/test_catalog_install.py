"""Exercise only files that the catalog subdir install receives."""
import importlib.util
import json
import os
from pathlib import Path
import shutil
import signal
import sys
import types
from unittest.mock import Mock, patch

import pytest

ROOT = Path(__file__).resolve().parents[2]


def load_package(path, name):
    spec = importlib.util.spec_from_file_location(name, path / '__init__.py', submodule_search_locations=[str(path)])
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


class Context:
    def __init__(self):
        self.tools = {}
        self.skills = {}

    def register_tool(self, *, name, toolset, schema, handler):
        self.tools[name] = handler

    def register_skill(self, name, path):
        self.skills[name] = path.read_text()  # Missing SKILL.md must fail registration.


def exercise_install(path, data, name='isolated_poptart'):
    module = load_package(path, name)
    ctx = Context()
    module.register(ctx)
    assert list(ctx.tools) == ['poptart_studio']
    assert 'poptart_studio' in ctx.skills['strudel-studio']
    for file in ['guest-document.html', 'guest-build.json', 'service/index.js',
                 'service/token.js', 'service/store.js', 'service/package.json']:
        assert (path / file).is_file(), file
    bridge = sys.modules[name + '.bridge']
    try:
        with patch.object(bridge, 'data_dir', return_value=data):
            result = json.loads(ctx.tools['poptart_studio']({'op': 'list', 'input': {}}))
            assert result['ok'], result
            assert result['data'] == []
    finally:
        state = data / 'service.json'
        if state.exists():
            pid = json.loads(state.read_text()).get('pid')
            if pid:
                os.kill(pid, signal.SIGTERM)  # Only the disposable test sidecar.
    return bridge


def test_subdir_only_install(tmp_path):
    installed = tmp_path / 'installed'
    shutil.copytree(ROOT / 'integration/hermes', installed,
                    ignore=shutil.ignore_patterns('__pycache__', 'assets'))
    exercise_install(installed, tmp_path / 'profile')


def test_import_without_fcntl_and_windows_lock(tmp_path):
    # Use the actual import guard, not a post-import monkeypatch of fcntl.
    windows = types.SimpleNamespace(LK_LOCK=1, LK_UNLCK=0, locking=Mock())
    with patch.dict(sys.modules, {'fcntl': None, 'msvcrt': windows}):
        bridge = exercise_install(ROOT / 'integration/hermes', tmp_path / 'profile', 'windows_poptart')
    assert bridge.fcntl is None
    assert [call.args[1:] for call in windows.locking.call_args_list] == [(1, 1), (0, 1)]
    assert (tmp_path / 'profile/startup.lock').read_bytes() == b'\0'


def test_no_lock_backend_fails_closed(tmp_path):
    module = load_package(ROOT / 'integration/hermes', 'unsupported_poptart')
    module.register(Context())
    bridge = sys.modules['unsupported_poptart.bridge']
    with patch.object(bridge, 'fcntl', None), patch.object(bridge, 'msvcrt', None):
        with pytest.raises(RuntimeError, match='startup lock'):
            with bridge.startup_lock(tmp_path / 'lock'):
                pytest.fail('Must not start without cross-process serialization')


def test_package_versions_match():
    from ruamel.yaml import YAML
    yaml = YAML(typ='safe')
    yaml.allow_duplicate_keys = False
    version = yaml.load((ROOT / 'integration/hermes/plugin.yaml').read_text())['version']
    for path in ['package.json', 'server/package.json', 'integration/hermes/service/package.json']:
        assert json.loads((ROOT / path).read_text())['version'] == version
    lock = json.loads((ROOT / 'package-lock.json').read_text())
    assert lock['version'] == lock['packages']['']['version'] == version
