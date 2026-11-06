import { randomBytes } from 'node:crypto';
import { mkdir, open, lstat, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function loadToken(path) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  try {
    const file = await open(path, 'wx', 0o600);
    try { await file.writeFile(randomBytes(32).toString('hex')); } finally { await file.close(); }
  } catch (e) { if (e.code !== 'EEXIST') throw e; }
  const info = await lstat(path);
  if (!info.isFile() || (info.mode & 0o777) !== 0o600 || info.uid !== process.getuid?.()) throw Error('Token file must be owner-owned regular mode 0600');
  const token = await readFile(path, 'utf8');
  if (!/^[a-f0-9]{64}$/.test(token)) throw Error('Invalid service token file');
  return token;
}
