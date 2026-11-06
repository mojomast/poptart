"""Scan every tracked blob in commits being pushed, without printing matching values."""
import re
import subprocess
import sys
patterns = [r'(?:ORBIT_TOKEN|OPENROUTER_API_KEY)\s*[:=]\s*[\"\x27]?[A-Za-z0-9_\-]{16,}',
 r'AIza[A-Za-z0-9_\-]{35}',r'sk-or-v1-[a-f0-9]{32,}',r'gh[pousr]_[A-Za-z0-9]{30,}',
 r'github_pat_[A-Za-z0-9_]{40,}',r'(?:colab[_-]?token|COLAB_TOKEN)\s*[:=]\s*[\"\x27]?[A-Za-z0-9._\-]{16,}',
 r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----']
regex=re.compile('|'.join(patterns))
refs=sys.argv[1:] or ['HEAD']
seen=set(); findings=[]
for ref in refs:
 for entry in subprocess.check_output(['git','ls-tree','-r',ref],text=True).splitlines():
  meta,path=entry.split('\t',1); sha=meta.split()[2]
  if sha in seen: continue
  seen.add(sha)
  content=subprocess.check_output(['git','cat-file','blob',sha]).decode('utf8',errors='replace')
  if regex.search(content): findings.append((ref,path))
if findings:
 for ref,path in findings: print('SECRET PATTERN:',ref,path)
 sys.exit(1)
print(f'Clean: {len(refs)} snapshots, {len(seen)} unique tracked blobs; provider, Orbit, Maps, Colab and private-key patterns')
