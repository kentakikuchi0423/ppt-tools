import { describe, expect, it } from 'vitest';
import { swapPositions } from '../../src/core/operations/swap.js';
import type { Shape } from '../../src/core/types.js';

const shape = (id: string, left: number, top: number, width: number, height: number): Shape => ({
  id,
  left,
  top,
  width,
  height,
});

describe('swapPositions', () => {
  it('fails for empty input', () => {
    expect(swapPositions([]).ok).toBe(false);
  });

  it('fails for a single shape', () => {
    expect(swapPositions([shape('a', 0, 0, 10, 10)]).ok).toBe(false);
  });

  it('fails for three shapes', () => {
    expect(
      swapPositions([
        shape('a', 0, 0, 10, 10),
        shape('b', 100, 100, 10, 10),
        shape('c', 200, 200, 10, 10),
      ]).ok,
    ).toBe(false);
  });

  it('swaps left and top of two shapes', () => {
    const a = shape('a', 10, 20, 100, 200);
    const b = shape('b', 300, 400, 50, 60);
    const r = swapPositions([a, b]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes[0]).toEqual({ id: 'a', left: 300, top: 400, width: 100, height: 200 });
    expect(r.shapes[1]).toEqual({ id: 'b', left: 10, top: 20, width: 50, height: 60 });
  });

  it('preserves width and height (does not swap them)', () => {
    const a = shape('a', 0, 0, 100, 200);
    const b = shape('b', 50, 50, 10, 20);
    const r = swapPositions([a, b]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes[0]?.width).toBe(100);
    expect(r.shapes[0]?.height).toBe(200);
    expect(r.shapes[1]?.width).toBe(10);
    expect(r.shapes[1]?.height).toBe(20);
  });

  it('preserves ids', () => {
    const r = swapPositions([shape('a', 0, 0, 10, 10), shape('b', 1, 1, 10, 10)]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.map((s) => s.id)).toEqual(['a', 'b']);
  });
});
