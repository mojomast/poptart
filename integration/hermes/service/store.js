import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

class ServiceError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
const fail = (code, message) => { throw new ServiceError(code, message); };
const object = (value, name) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('VALIDATION_ERROR', `${name} must be an object`);
  return value;
};
const text = (value, name, max = 100000) => {
  if (typeof value !== 'string' || value.length > max || (name !== 'code' && !value.trim())) fail('VALIDATION_ERROR', `Invalid ${name}`);
  return value;
};
const id = value => {
  text(value, 'id', 128);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value)) fail('VALIDATION_ERROR', 'Invalid id');
  return value;
};
const revision = value => {
  if (!Number.isSafeInteger(value) || value < 1) fail('VALIDATION_ERROR', 'expectedRevision must be a positive integer');
  return value;
};
const validateFields = (input, partial = false) => {
  const result = {};
  for (const field of ['title', 'code', 'tempo', 'sections']) {
    if (!(field in input)) {
      if (!partial) fail('VALIDATION_ERROR', `${field} is required`);
      continue;
    }
    const value = input[field];
    if (field === 'title') result.title = text(value, field, 200);
    if (field === 'code') result.code = text(value, field);
    if (field === 'tempo') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 20 || value > 400) fail('VALIDATION_ERROR', 'tempo must be between 20 and 400');
      result.tempo = value;
    }
    if (field === 'sections') {
      if (!Array.isArray(value) || value.length > 500) fail('VALIDATION_ERROR', 'sections must be an array of at most 500 items');
      const ids = new Set();
      result.sections = value.map(section => {
        object(section, 'section');
        const sectionId = id(section.id);
        if (ids.has(sectionId)) fail('VALIDATION_ERROR', 'section ids must be unique');
        ids.add(sectionId);
        return { id: sectionId, name: text(section.name, 'name', 200), code: text(section.code, 'code') };
      });
    }
  }
  if (partial && !Object.keys(result).length) fail('VALIDATION_ERROR', 'No track fields supplied');
  return result;
};
const copy = value => structuredClone(value);

/** One store instance owns one data file. All mutations are serialized in this process. */
export function createStore(file) {
  let queue = Promise.resolve();
  async function load() {
    try {
      const data = JSON.parse(await readFile(file, 'utf8'));
      if (!data || !Array.isArray(data.tracks) || !Array.isArray(data.snapshots)) throw new Error('Invalid store format');
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') return { tracks: [], snapshots: [] };
      throw error;
    }
  }
  async function save(data) {
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify(data), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
      await rename(temporary, file);
    } finally { await unlink(temporary).catch(() => {}); }
  }
  async function run(request) {
    object(request, 'request');
    const requestedOperation = text(request.operation, 'operation', 100);
    const operation = ({ list_tracks: 'track.list', read_track: 'track.get', create_track: 'track.create', update_track: 'track.update', snapshot_track: 'snapshot.create', restore_track: 'snapshot.restore', request_transport: 'transport' })[requestedOperation] || requestedOperation;
    const input = object(request.input, 'input');
    const data = await load();
    const find = () => {
      const trackId = id(input.trackId);
      const track = data.tracks.find(item => item.id === trackId);
      if (!track) fail('NOT_FOUND', 'Track not found');
      return track;
    };
    const check = track => {
      if (revision(input.expectedRevision) !== track.revision) fail('CONFLICT', 'Track revision does not match');
    };
    let result, changed = false;
    switch (operation) {
      case 'track.list': result = data.tracks; break;
      case 'track.get': result = find(); break;
      case 'track.create': {
        const fields = validateFields(input);
        const now = new Date().toISOString();
        result = { id: randomUUID(), ...fields, revision: 1, createdAt: now, updatedAt: now };
        data.tracks.push(result); changed = true; break;
      }
      case 'track.update': {
        const track = find(); check(track);
        Object.assign(track, validateFields(object(input.changes, 'changes'), true));
        track.revision++; track.updatedAt = new Date().toISOString();
        result = track; changed = true; break;
      }
      case 'track.delete': {
        const track = find(); check(track);
        data.tracks = data.tracks.filter(item => item.id !== track.id);
        data.snapshots = data.snapshots.filter(item => item.trackId !== track.id);
        result = { id: track.id }; changed = true; break;
      }
      case 'snapshot.create': {
        const track = find(); check(track);
        result = { id: randomUUID(), trackId: track.id, createdAt: new Date().toISOString(), track: copy(track) };
        data.snapshots.push(result); changed = true; break;
      }
      case 'snapshot.list': {
        const track = find(); result = data.snapshots.filter(item => item.trackId === track.id); break;
      }
      case 'snapshot.restore': {
        const track = find(); check(track);
        const snapshotId = id(input.snapshotId);
        const snapshot = data.snapshots.find(item => item.trackId === track.id && item.id === snapshotId);
        if (!snapshot) fail('NOT_FOUND', 'Snapshot not found');
        Object.assign(track, validateFields(snapshot.track));
        track.revision++; track.updatedAt = new Date().toISOString();
        result = track; changed = true; break;
      }
      case 'list_sections': result = find().sections; break;
      case 'update_section': {
        const track = find(); check(track);
        const sectionId = id(input.sectionId);
        const section = object(input.section, 'section');
        const replacement = { id: sectionId, name: text(section.name, 'name', 200), code: text(section.code, 'code') };
        const index = track.sections.findIndex(item => item.id === sectionId);
        if (index < 0) track.sections.push(replacement); else track.sections[index] = replacement;
        if (track.sections.length > 500) fail('VALIDATION_ERROR', 'Too many sections');
        track.revision++; track.updatedAt = new Date().toISOString(); result = track; changed = true; break;
      }
      case 'analyze_track': {
        const track = find();
        result = { characters: track.code.length, lines: track.code.split('\n').length, sections: track.sections.length, audio: null, note: 'Static counts only; audio has not been analyzed.' }; break;
      }
      case 'export_track': {
        const track = find(); result = { filename: `${track.id}.strudel`, code: track.code, sections: track.sections }; break;
      }
      case 'get_playback_state': result = { status: 'unknown', note: 'Playback is owned by the browser; no player is connected to this service.' }; break;
      case 'transport': {
        const action = text(input.action, 'action', 20);
        if (!['play', 'stop', 'mute', 'unmute'].includes(action)) fail('VALIDATION_ERROR', 'Invalid transport action');
        if (input.trackId !== undefined) find();
        if (action === 'play' && input.trackId === undefined) fail('VALIDATION_ERROR', 'play requires trackId');
        result = { action, ...(input.trackId !== undefined ? { trackId: input.trackId } : {}) }; break;
      }
      default: fail('UNKNOWN_OPERATION', 'Unknown operation');
    }
    if (changed) await save(data);
    return copy(result);
  }
  return {
    execute(request) {
      const current = queue.then(() => run(request));
      queue = current.catch(() => {});
      return current.then(data => ({ ok: true, data }), error => ({ ok: false, error: { code: error.code && error instanceof ServiceError ? error.code : 'INTERNAL_ERROR', message: error instanceof ServiceError ? error.message : 'Service operation failed' } }));
    }
  };
}
