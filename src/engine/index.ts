import { Drawer } from '@strudel/draw';
/** Browser-only Strudel controller. See README for asset and lifecycle details. */
export type SampleBank = string | { map: Record<string, unknown>; baseUrl?: string };
export interface EngineState {
  ready: boolean;
  playing: boolean;
  muted: boolean;
  gain: number;
  lastGoodCode: string | null;
  error: string | null;
  sampleErrors: string[];
}
export interface EngineOptions { sampleBanks?: SampleBank[] }
export type MiniRange = [number, number];
type HighlightListener = (ranges: MiniRange[]) => void;
type Listener = (state: EngineState) => void;
type Module = typeof import('@strudel/web');
type Repl = Awaited<ReturnType<Module['initStrudel']>>;

const message = (error: unknown) => error instanceof Error ? error.message : String(error);

// Strudel's REPL, audio graph, and evaluator scope are global to the page.
// Reuse one controller across React mounts rather than creating competing REPLs.
class StrudelEngine {
  private mod: Module | null = null;
  private repl: Repl | null = null;
  private initializing: Promise<void> | null = null;
  private audioInitializing: Promise<void> | null = null;
  private listeners = new Set<Listener>();
  private highlightListeners = new Set<HighlightListener>();
  // Same scheduler-backed Drawer/currentFrame mechanism as StrudelMirror 1.2.6.
  // Separate imperative subscribers: never publish animation frames as React state.
  private drawer = new Drawer((haps, time) => {
    const ranges = new Map<string, MiniRange>();
    for (const hap of haps) {
      if (!hap.isActive(time)) continue;
      for (const { start, end } of hap.context?.locations ?? []) {
        if (Number.isInteger(start) && Number.isInteger(end) && start >= 0 && end > start && end <= (this.state.lastGoodCode?.length ?? 0)) {
          ranges.set(`${start}:${end}`, [start, end]);
        }
      }
    }
    this.publishHighlights([...ranges.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]));
  }, [0, 0]);
  private highlightKey = '';
  subscribeHighlights = (listener: HighlightListener): (() => void) => {
    this.highlightListeners.add(listener);
    return () => { this.highlightListeners.delete(listener); };
  };
  private publishHighlights(ranges: MiniRange[]) {
    const key = JSON.stringify(ranges);
    if (key === this.highlightKey) return;
    this.highlightKey = key;
    this.highlightListeners.forEach(listener => listener(ranges));
  }
  private resetDrawer() {
    this.drawer.stop();
    this.drawer.visibleHaps = [];
    this.drawer.lastFrame = null;
    this.publishHighlights([]);
    if (this.repl && this.state.playing) this.drawer.start(this.repl.scheduler);
  }
  private generation = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private state: EngineState = { ready: false, playing: false, muted: false, gain: 0.8, lastGoodCode: null, error: null, sampleErrors: [] };

  getState = (): EngineState => this.state;
  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(patch: Partial<EngineState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener(this.state));
  }
  private applyGain() {
    if (!this.mod) return;
    const param = this.mod.getSuperdoughAudioController().output.destinationGain.gain;
    const now = this.mod.getAudioContext().currentTime;
    param.cancelScheduledValues(now);
    param.setTargetAtTime(this.state.muted ? 0 : this.state.gain, now, 0.01);
  }

  /** Load JS and register synths and optional sample manifests. Safe to call before a gesture. */
  boot = (options: EngineOptions = {}): Promise<void> => {
    if (this.initializing) return this.initializing;
    this.initializing = (async () => {
      try {
        const mod = await import('@strudel/web');
        this.mod = mod;
        // Strudel catches evaluation exceptions; inspect repl.state after evaluate.
        this.repl = await mod.initStrudel({ onToggle: (playing: boolean) => {
          this.update({ playing });
          if (!playing) { this.drawer.stop(); this.publishHighlights([]); }
        } });
        this.applyGain();
        const errors: string[] = [];
        for (const bank of options.sampleBanks ?? []) {
          try {
            if (typeof bank === 'string') await mod.samples(bank);
            else await mod.samples(bank.map, bank.baseUrl);
          } catch (error) { errors.push(`${typeof bank === 'string' ? bank : 'sample map'}: ${message(error)}`); }
        }
        this.update({ ready: true, sampleErrors: errors, error: null });
      } catch (error) {
        this.initializing = null;
        this.update({ error: message(error) });
        throw error;
      }
    })();
    return this.initializing;
  };

  /** Call directly from a user gesture. Evaluate serially and retain the previous pattern on errors. */
  play = (code: string, bpm?: number): Promise<void> => {
    const token = ++this.generation;
    // Resume synchronously when already booted, preserving browser user activation.
    const resume = this.mod?.getAudioContext().resume().then(
      () => null,
      (error: unknown) => error,
    );
    const task = async () => {
      let previous: { pattern: unknown; cps: number } | null = null;
      try {
        await this.boot();
        if (token !== this.generation) return;
        const mod = this.mod!;
        if (resume) {
          const resumeError = await resume;
          if (resumeError) throw resumeError;
        } else {
          await mod.getAudioContext().resume();
        }
        if (!this.audioInitializing) {
          this.audioInitializing = mod.initAudio().catch((error) => { this.audioInitializing = null; throw error; });
        }
        await this.audioInitializing;
        if (mod.getAudioContext().state !== 'running') throw new Error('Audio context is not running; play from a user gesture.');
        if (token !== this.generation) return;
        if (!code.trim()) throw new Error('No code to evaluate');
        if (bpm !== undefined && (!Number.isFinite(bpm) || bpm <= 0)) throw new Error('Tempo must be a positive finite number');
        // Parse before entering the stateful REPL: an unterminated string must
        // never reset live REPL definitions/transforms or touch the scheduler.
        mod.transpiler(code);
        if (this.state.playing && this.repl!.state.pattern) {
          previous = { pattern: this.repl!.state.pattern, cps: this.repl!.scheduler.cps };
        }
        await this.repl!.evaluate(code, true);
        const error = this.repl!.state.evalError;
        if (error) throw error;
        if (token !== this.generation) { this.repl!.stop(); return; }
        if (bpm !== undefined) this.repl!.setCps(bpm / 240);
        this.update({ playing: this.repl!.state.started, lastGoodCode: code, error: null });
        this.resetDrawer();
      } catch (error) {
        if (token === this.generation) {
          let recoveryError = '';
          if (previous) {
            try {
              // Restore the evaluated Pattern object, not its source: do not
              // re-run arbitrary user code or replay its side effects on failure.
              await this.repl!.setPattern(previous.pattern, true);
              this.repl!.setCps(previous.cps);
              this.resetDrawer();
              if (token !== this.generation) { this.repl!.stop(); return; }
            } catch (failure) { recoveryError = `; playback recovery failed: ${message(failure)}`; }
          }
          if (token === this.generation) this.update({ playing: this.repl?.state.started ?? false, error: message(error) + recoveryError });
        }
        throw error;
      }
    };
    const result = this.queue.then(task, task);
    this.queue = result.catch(() => {});
    return result;
  };

  stop = (): void => {
    ++this.generation;
    this.drawer.stop();
    this.publishHighlights([]);
    this.repl?.stop();
    this.update({ playing: false });
  };
  setGain = (gain: number): void => {
    if (!Number.isFinite(gain)) throw new Error('Gain must be a finite number');
    this.update({ gain: Math.max(0, Math.min(1, gain)) });
    this.applyGain();
  };
  setMuted = (muted: boolean): void => { this.update({ muted }); this.applyGain(); };
  /** Stop and remove subscriptions; the global audio context stays reusable. */
  dispose = (): void => { this.stop(); this.listeners.clear(); this.highlightListeners.clear(); };
}

export const engine = new StrudelEngine();
export const getEngine = () => engine;
export const createEngine = () => engine;
