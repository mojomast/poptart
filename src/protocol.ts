import type { Envelope, ToolRequest, ToolResult } from '../shared/contracts';

// Data documents on native hosts may omit randomUUID while still providing
// getRandomValues. This is an ID, not a substitute for the host capability.
export const randomId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};
export const envelope = (type: string, payload: unknown, capability: string, id: string = randomId()): Envelope => ({ version: 1, id, type, payload, capability });
export function valid(value: unknown, capability: string): value is Envelope {
  if (!value || typeof value !== 'object') return false;
  const m = value as Partial<Envelope>;
  return m.version === 1 && typeof m.id === 'string' && typeof m.type === 'string' && m.capability === capability;
}
export async function tool(request: ToolRequest): Promise<ToolResult> {
  try {
    const response = await fetch('/api/tool', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
    const result = await response.json();
    if (!result || typeof result.ok !== 'boolean') throw new Error('Invalid response from service');
    return result as ToolResult;
  } catch (error) { return { ok: false, error: { code: 'NETWORK_ERROR', message: error instanceof Error ? error.message : 'Service unavailable' } }; }
}
