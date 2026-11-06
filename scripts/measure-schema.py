import importlib.util
import json
from pathlib import Path
import tiktoken
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('poptart_schema',root/'integration/hermes/bridge.py')
bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
text=json.dumps([bridge.SCHEMA],separators=(',',':'),ensure_ascii=False)
print('o200k_base:',len(tiktoken.get_encoding('o200k_base').encode(text)))
print('cl100k_base:',len(tiktoken.get_encoding('cl100k_base').encode(text)))
(root/'shared/tool-schema.json').write_text(json.dumps(bridge.SCHEMA,separators=(',',':'))+'\n')
