from pathlib import Path
import re
import pytest
from ruamel.yaml import YAML

ROOT=Path(__file__).resolve().parents[2]
def strict(text):
    y=YAML(typ='safe'); y.allow_duplicate_keys=False
    return y.load(text)

def test_manifest_strict():
    text=(ROOT/'integration/hermes/plugin.yaml').read_text()
    m=strict(text)
    assert len(re.findall(r'^name:',text,re.M))==1
    assert len(re.findall(r'^version:',text,re.M))==1
    assert m['provides_tools']==['poptart_studio']
    assert len(m['provides_tools'])==len(set(m['provides_tools']))

def test_duplicates_are_rejected():
    with pytest.raises(Exception): strict('name: a\nname: b\n')
