/** Stable foundation contract. All messages and results must be JSON-serializable. */
export interface Section { id: string; name: string; code: string }
export interface Track { id: string; title: string; code: string; tempo: number; sections: Section[]; revision: number; createdAt: string; updatedAt: string }
export type TransportAction = 'play' | 'stop' | 'mute' | 'unmute';
export interface PlaybackState { status: 'stopped' | 'playing' | 'error'; muted: boolean; trackId?: string; error?: string }
export interface Envelope { version: 1; id: string; type: string; payload: unknown; capability?: string }
export interface ToolRequest { operation: string; input: Record<string, unknown> }
export type ToolResult = { ok: true; data: unknown } | { ok: false; error: { code: string; message: string } };
