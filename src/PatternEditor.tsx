import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import type { MiniRange } from './engine';

export interface PatternEditorHandle { evaluated(code: string): void; highlight(ranges: unknown): void }

/** Keep the accessible textarea. An inert, scroll-synced text mirror paints only
 * backgrounds, using Strudel hap locations (never HTML from executed code).
 * Dirty buffers deliberately pause highlights rather than show wrong positions.
 */
export const PatternEditor = forwardRef<PatternEditorHandle, {code: string; onChange(code: string): void}>(function PatternEditor({code, onChange}, ref) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const mirror = useRef<HTMLPreElement>(null);
  const buffer = useRef(code); buffer.current = code;
  const evaluatedCode = useRef('');
  const ranges = useRef<MiniRange[]>([]);
  const lastPaint = useRef('');
  const paint = () => {
    if (!mirror.current) return;
    const source = buffer.current;
    const active = source === evaluatedCode.current ? ranges.current : [];
    const key = JSON.stringify([source, active]);
    if (key === lastPaint.current) return;
    lastPaint.current = key;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    // Merge overlapping/nested locations from stacked patterns, preserving text.
    const merged: MiniRange[] = [];
    for (const [start, end] of active) {
      const previous = merged.at(-1);
      if (previous && start <= previous[1]) previous[1] = Math.max(previous[1], end);
      else merged.push([start, end]);
    }
    for (const [start, end] of merged) {
      fragment.append(document.createTextNode(source.slice(cursor, start)));
      const mark = document.createElement('mark');
      mark.className = 'mini-highlight';
      mark.dataset.start = String(start); mark.dataset.end = String(end);
      mark.textContent = source.slice(start, end);
      fragment.append(mark); cursor = end;
    }
    fragment.append(document.createTextNode(source.slice(cursor) + '\n'));
    mirror.current.replaceChildren(fragment);
  };
  useImperativeHandle(ref, () => ({
    evaluated(value) { evaluatedCode.current = value; ranges.current = []; paint(); },
    highlight(value) {
      if (!Array.isArray(value) || value.length > 4096) return;
      const length = evaluatedCode.current.length;
      ranges.current = value.filter((range): range is MiniRange => Array.isArray(range) && range.length === 2 && Number.isInteger(range[0]) && Number.isInteger(range[1]) && range[0] >= 0 && range[1] > range[0] && range[1] <= length).sort((a,b) => a[0]-b[0] || a[1]-b[1]);
      paint();
    },
  }));
  useLayoutEffect(paint, [code]);
  const syncScroll = () => {
    if (!mirror.current || !textarea.current) return;
    mirror.current.style.transform = `translate(${-textarea.current.scrollLeft}px, ${-textarea.current.scrollTop}px)`;
  };
  return <div className="pattern-editor">
    <pre ref={mirror} className="pattern-highlights" aria-hidden="true"/>
    <textarea ref={textarea} aria-label="Pattern code" spellCheck={false} value={code} onScroll={syncScroll} onChange={event => onChange(event.target.value)}/>
  </div>;
});
