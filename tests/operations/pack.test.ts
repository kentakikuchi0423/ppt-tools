import { describe, expect, it } from 'vitest';
import { packDown, packLeft, packRight, packUp } from '../../src/core/operations/pack.js';
import type { Shape } from '../../src/core/types.js';

const shape = (id: string, left: number, top: number, width: number, height: number): Shape => ({
  id,
  left,
  top,
  width,
  height,
});

const ids = (shapes: readonly Shape[]) => shapes.map((s) => s.id).sort();

describe('packDown', () => {
  it('returns empty for empty input', () => {
    expect(packDown([])).toEqual([]);
  });

  it('returns a single shape unchanged in geometry', () => {
    const input = [shape('a', 10, 20, 30, 40)];
    expect(packDown(input)).toEqual(input);
  });

  it('keeps the top-most shape in place and stacks the rest beneath it', () => {
    const a = shape('a', 0, 0, 100, 50);
    const b = shape('b', 0, 100, 100, 30);
    const c = shape('c', 0, 200, 100, 20);
    const out = packDown([a, b, c]);
    expect(out[0]).toEqual(a);
    expect(out[1]?.top).toBe(50);
    expect(out[2]?.top).toBe(80);
  });

  it('sorts unsorted input by top before packing', () => {
    const out = packDown([
      shape('c', 0, 200, 10, 20),
      shape('a', 0, 0, 10, 50),
      shape('b', 0, 100, 10, 30),
    ]);
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(out[0]?.top).toBe(0);
    expect(out[1]?.top).toBe(50);
    expect(out[2]?.top).toBe(80);
  });

  it('removes overlap between adjacent shapes', () => {
    // b overlaps a (top=20 < a.bottom=50). After pack, b.top should be 50.
    const out = packDown([shape('a', 0, 0, 10, 50), shape('b', 0, 20, 10, 30)]);
    expect(out[1]?.top).toBe(50);
  });

  it('preserves left, width, height and ids', () => {
    const a = shape('a', 5, 0, 100, 50);
    const b = shape('b', 7, 100, 200, 30);
    const out = packDown([a, b]);
    expect(ids(out)).toEqual(['a', 'b']);
    expect(out[0]?.left).toBe(5);
    expect(out[0]?.width).toBe(100);
    expect(out[0]?.height).toBe(50);
    expect(out[1]?.left).toBe(7);
    expect(out[1]?.width).toBe(200);
    expect(out[1]?.height).toBe(30);
  });
});

describe('packUp', () => {
  it('returns empty for empty input', () => {
    expect(packUp([])).toEqual([]);
  });

  it('returns a single shape unchanged in geometry', () => {
    const input = [shape('a', 10, 20, 30, 40)];
    expect(packUp(input)).toEqual(input);
  });

  it('keeps the bottom-most shape in place and stacks the rest above it', () => {
    const a = shape('a', 0, 0, 100, 50);
    const b = shape('b', 0, 100, 100, 30);
    const c = shape('c', 0, 200, 100, 20);
    const out = packUp([a, b, c]);
    // c is bottom-most, anchored at top=200.
    expect(out.find((s) => s.id === 'c')?.top).toBe(200);
    // b sits directly above c: 200 - 30 = 170.
    expect(out.find((s) => s.id === 'b')?.top).toBe(170);
    // a sits directly above b: 170 - 50 = 120.
    expect(out.find((s) => s.id === 'a')?.top).toBe(120);
  });

  it('handles unsorted input', () => {
    const out = packUp([
      shape('b', 0, 100, 10, 30),
      shape('c', 0, 200, 10, 20),
      shape('a', 0, 0, 10, 50),
    ]);
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(out[2]?.top).toBe(200);
    expect(out[1]?.top).toBe(170);
    expect(out[0]?.top).toBe(120);
  });

  it('removes overlap between adjacent shapes', () => {
    // a (top=30) is the bottom-most (largest top) and anchors. b (top=20)
    // should move so its bottom touches a's top: b.top = 30 - 30 = 0.
    const out = packUp([shape('a', 0, 30, 10, 50), shape('b', 0, 20, 10, 30)]);
    expect(out.find((s) => s.id === 'a')?.top).toBe(30);
    expect(out.find((s) => s.id === 'b')?.top).toBe(0);
  });

  it('preserves left, width, height and ids', () => {
    const a = shape('a', 5, 0, 100, 50);
    const b = shape('b', 7, 100, 200, 30);
    const out = packUp([a, b]);
    expect(ids(out)).toEqual(['a', 'b']);
    expect(out.find((s) => s.id === 'a')?.left).toBe(5);
    expect(out.find((s) => s.id === 'a')?.width).toBe(100);
    expect(out.find((s) => s.id === 'a')?.height).toBe(50);
  });
});

describe('packLeft', () => {
  it('returns empty for empty input', () => {
    expect(packLeft([])).toEqual([]);
  });

  it('returns a single shape unchanged', () => {
    const input = [shape('a', 10, 20, 30, 40)];
    expect(packLeft(input)).toEqual(input);
  });

  it('packs shapes leftward against the left-most anchor', () => {
    const a = shape('a', 0, 0, 50, 10);
    const b = shape('b', 100, 0, 30, 10);
    const c = shape('c', 200, 0, 20, 10);
    const out = packLeft([a, b, c]);
    expect(out[0]?.left).toBe(0);
    expect(out[1]?.left).toBe(50);
    expect(out[2]?.left).toBe(80);
  });

  it('sorts unsorted input by left', () => {
    const out = packLeft([
      shape('c', 200, 0, 20, 10),
      shape('a', 0, 0, 50, 10),
      shape('b', 100, 0, 30, 10),
    ]);
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('removes overlap', () => {
    const out = packLeft([shape('a', 0, 0, 50, 10), shape('b', 20, 0, 30, 10)]);
    expect(out[1]?.left).toBe(50);
  });

  it('preserves top, width, height, ids', () => {
    const out = packLeft([shape('a', 0, 5, 50, 10), shape('b', 100, 7, 30, 12)]);
    expect(out[0]?.top).toBe(5);
    expect(out[1]?.top).toBe(7);
    expect(out[1]?.width).toBe(30);
    expect(out[1]?.height).toBe(12);
    expect(ids(out)).toEqual(['a', 'b']);
  });
});

describe('packRight', () => {
  it('returns empty for empty input', () => {
    expect(packRight([])).toEqual([]);
  });

  it('returns a single shape unchanged', () => {
    const input = [shape('a', 10, 20, 30, 40)];
    expect(packRight(input)).toEqual(input);
  });

  it('packs shapes rightward against the right-most anchor', () => {
    const a = shape('a', 0, 0, 50, 10);
    const b = shape('b', 100, 0, 30, 10);
    const c = shape('c', 200, 0, 20, 10);
    const out = packRight([a, b, c]);
    expect(out.find((s) => s.id === 'c')?.left).toBe(200);
    expect(out.find((s) => s.id === 'b')?.left).toBe(170);
    expect(out.find((s) => s.id === 'a')?.left).toBe(120);
  });

  it('handles unsorted input', () => {
    const out = packRight([
      shape('b', 100, 0, 30, 10),
      shape('c', 200, 0, 20, 10),
      shape('a', 0, 0, 50, 10),
    ]);
    expect(out.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('removes overlap', () => {
    // a (left=30) is the right-most and anchors. b (left=20) should move so
    // its right edge touches a's left: b.left = 30 - 30 = 0.
    const out = packRight([shape('a', 30, 0, 50, 10), shape('b', 20, 0, 30, 10)]);
    expect(out.find((s) => s.id === 'a')?.left).toBe(30);
    expect(out.find((s) => s.id === 'b')?.left).toBe(0);
  });

  it('preserves top, width, height, ids', () => {
    const out = packRight([shape('a', 0, 5, 50, 10), shape('b', 100, 7, 30, 12)]);
    expect(out.find((s) => s.id === 'a')?.top).toBe(5);
    expect(ids(out)).toEqual(['a', 'b']);
  });
});
