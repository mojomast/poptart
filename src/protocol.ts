import type { Envelope, ToolRequest, ToolResult } from '../shared/contracts';

export const envelope = (type: string, payload: unknown, capability: string, id: string = crypto.randomUUID()): Envelope => ({ version: 1, id, type, payload, capability });
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
