import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStore } from './store.js';
import { createApp } from './index.js';

const fields = { title: 'First', code: 'sound("bd")', tempo: 120, sections: [{ id: 'intro', name: 'Intro', code: 'silence' }] };
async function setup(t) {
  const dir = await mkdtemp(join(tmpdir(), 'poptart-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return join(dir, 'store.json');
}
const call = (store, operation, input = {}) => store.execute({ operation, input });

test('track persistence, snapshots, and optimistic concurrent writes', async t => {
  const file = await setup(t);
  const store = createStore(file);
  const created = await call(store, 'track.create', fields);
  assert.equal(created.ok, true);
  const track = created.data;
  assert.equal(track.revision, 1);
  const snapshot = await call(store, 'snapshot.create', { trackId: track.id, expectedRevision: 1 });
  assert.equal(snapshot.ok, true);
  const writes = await Promise.all(['Second', 'Third'].map(title => call(store, 'track.update', { trackId: track.id, expectedRevision: 1, changes: { title } })));
  assert.equal(writes.filter(x => x.ok).length, 1);
  assert.equal(writes.find(x => !x.ok).error.code, 'CONFLICT');
  const restored = await call(store, 'snapshot.restore', { trackId: track.id, snapshotId: snapshot.data.id, expectedRevision: 2 });
  assert.equal(restored.data.title, 'First');
  assert.equal(restored.data.revision, 3);
  assert.equal(restored.data.createdAt, track.createdAt);
  assert.deepEqual((await call(createStore(file), 'track.get', { trackId: track.id })).data, restored.data);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).tracks.length, 1);
  assert.equal((await call(store, 'track.delete', { trackId: track.id, expectedRevision: 2 })).error.code, 'CONFLICT');
  assert.equal((await call(store, 'track.delete', { trackId: track.id, expectedRevision: 3 })).ok, true);
  assert.equal((await call(store, 'track.get', { trackId: track.id })).error.code, 'NOT_FOUND');
});

test('validation rejects malformed inputs without changing data', async t => {
  const store = createStore(await setup(t));
  assert.equal((await call(store, 'track.create', { ...fields, tempo: -1 })).error.code, 'VALIDATION_ERROR');
  assert.equal((await call(store, 'track.create', { ...fields, sections: [fields.sections[0], fields.sections[0]] })).error.code, 'VALIDATION_ERROR');
  assert.equal((await call(store, 'track.list')).data.length, 0);
  assert.equal((await call(store, 'unknown')).error.code, 'UNKNOWN_OPERATION');
  assert.equal((await call(store, 'transport', { action: 'play' })).error.code, 'VALIDATION_ERROR');
  assert.deepEqual((await call(store, 'transport', { action: 'stop' })).data, { action: 'stop' });
});

test('HTTP endpoint accepts ToolRequest and handles invalid JSON and CORS', async t => {
  const server = createApp({ file: await setup(t), origin: 'http://localhost:5173' });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/api/tool`;
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' }, body: JSON.stringify({ operation: 'track.create', input: fields }) });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal((await response.json()).data.title, 'First');
  const invalid = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error.code, 'INVALID_JSON');
});

test('agent workflow writes sections, detects conflict and exports restored revision', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'poptart-workflow-'));
  try {
    const store = createStore(join(dir, 'tracks.json'));
    const call = async (operation, input) => store.execute({ operation, input });
    const created = await call('create_track', { title: 'Workflow', code: 's("bd")', tempo: 120, sections: [] });
    assert.equal(created.ok, true);
    const track = created.data;
    const snapshot = await call('snapshot_track', { trackId: track.id, expectedRevision: track.revision });
    assert.equal(snapshot.ok, true);
    const drums = await call('update_track', { trackId: track.id, expectedRevision: track.revision, changes: { code: 'stack(s("bd*4"),note("c2").s("sawtooth"))' } });
    assert.equal(drums.ok, true);
    const section = await call('update_section', { trackId: track.id, expectedRevision: drums.data.revision, sectionId: 'verse', section: { name: 'Verse', code: 'note("c3 eb3")' } });
    assert.equal(section.data.sections.length, 1);
    const conflict = await call('update_track', { trackId: track.id, expectedRevision: track.revision, changes: { code: 'bad' } });
    assert.equal(conflict.error.code, 'CONFLICT');
    assert.equal((await call('list_sections', { trackId: track.id })).data[0].id, 'verse');
    const restored = await call('restore_track', { trackId: track.id, expectedRevision: section.data.revision, snapshotId: snapshot.data.id });
    assert.equal(restored.data.code, track.code);
    assert.equal((await call('export_track', { trackId: track.id })).data.code, track.code);
    assert.equal((await call('read_track', { trackId: '../private' })).error.code, 'VALIDATION_ERROR');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
