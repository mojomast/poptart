import importlib.util
from pathlib import Path
import pytest

ROOT=Path(__file__).resolve().parents[2]

def module(path):
    spec=importlib.util.spec_from_file_location('poptart_bump_test',ROOT/'scripts/bump-plugin-version.py')
    mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
    mod.PLUGIN=path
    return mod

def test_bump_only_version(tmp_path):
    path=tmp_path/'plugin.yaml'
    before='name: hermes-strudel-studio\nversion: "0.2.1"\nprovides_tools: [poptart_studio]\n'
    path.write_text(before)
    module(path).bump('0.2.2')
    assert path.read_text()==before.replace('0.2.1','0.2.2')

@pytest.mark.parametrize('text',[
    'name: hermes-strudel-studio\nversion: "0.2.1"\nversion: "0.2.0"\n',
    'name: wrong-plugin\nversion: "0.2.1"\n',
])
def test_bump_refuses_invalid_manifest(tmp_path,text):
    path=tmp_path/'plugin.yaml';path.write_text(text)
    with pytest.raises(SystemExit): module(path).bump('0.2.2')
    assert path.read_text()==text
