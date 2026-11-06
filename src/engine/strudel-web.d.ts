declare module '@strudel/web' {
  export function initStrudel(options?: Record<string, unknown>): Promise<{
    evaluate(code: string, autostart?: boolean): Promise<unknown>;
    stop(): void;
    setCps(cps: number): unknown;
    state: { evalError?: unknown; schedulerError?: unknown; started: boolean };
  }>;
  export function getAudioContext(): AudioContext;
  export function initAudio(): Promise<void>;
  export function getSuperdoughAudioController(): { output: { destinationGain: GainNode } };
  export function samples(map: string | Record<string, unknown>, baseUrl?: string): Promise<void>;
}
