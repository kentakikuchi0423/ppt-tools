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

describe('packDown — pile collapses to the bottom', () => {
  it('fails for empty input', () => {
    expect(packDown([]).ok).toBe(false);
  });

  it('fails for a single shape', () => {
    expect(packDown([shape('a', 0, 0, 10, 10)]).ok).toBe(false);
  });

  it('keeps the bottom-most shape and stacks the rest above it', () => {
    const a = shape('a', 0, 0, 100, 50);
    const b = shape('b', 0, 100, 100, 30);
    const c = shape('c', 0, 200, 100, 20);
    const r = packDown([a, b, c]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // c is bottom-most (largest top), anchored.
    expect(r.shapes.find((s) => s.id === 'c')?.top).toBe(200);
    // b sits directly above c: 200 - 30 = 170.
    expect(r.shapes.find((s) => s.id === 'b')?.top).toBe(170);
    // a sits directly above b: 170 - 50 = 120.
    expect(r.shapes.find((s) => s.id === 'a')?.top).toBe(120);
  });

  it('handles unsorted input', () => {
    const r = packDown([
      shape('b', 0, 100, 10, 30),
      shape('c', 0, 200, 10, 20),
      shape('a', 0, 0, 10, 50),
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(r.shapes[2]?.top).toBe(200);
    expect(r.shapes[1]?.top).toBe(170);
    expect(r.shapes[0]?.top).toBe(120);
  });

  it('removes overlap between adjacent shapes', () => {
    // a (top=30) is the bottom-most and anchors. b (top=20) must move so its
    // bottom touches a's top: b.top = 30 - 30 = 0.
    const r = packDown([shape('a', 0, 30, 10, 50), shape('b', 0, 20, 10, 30)]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.find((s) => s.id === 'a')?.top).toBe(30);
    expect(r.shapes.find((s) => s.id === 'b')?.top).toBe(0);
  });

  it('preserves left, width, height and ids', () => {
    const a = shape('a', 5, 0, 100, 50);
    const b = shape('b', 7, 100, 200, 30);
    const r = packDown([a, b]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(ids(r.shapes)).toEqual(['a', 'b']);
    expect(r.shapes.find((s) => s.id === 'a')?.left).toBe(5);
    expect(r.shapes.find((s) => s.id === 'a')?.width).toBe(100);
    expect(r.shapes.find((s) => s.id === 'a')?.height).toBe(50);
  });
});

describe('packUp — pile collapses to the top', () => {
  it('fails for empty input', () => {
    expect(packUp([]).ok).toBe(false);
  });

  it('fails for a single shape', () => {
    expect(packUp([shape('a', 0, 0, 10, 10)]).ok).toBe(false);
  });

  it('keeps the top-most shape and stacks the rest below it', () => {
    const a = shape('a', 0, 0, 100, 50);
    const b = shape('b', 0, 100, 100, 30);
    const c = shape('c', 0, 200, 100, 20);
    const r = packUp([a, b, c]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes[0]).toEqual(a);
    expect(r.shapes[1]?.top).toBe(50);
    expect(r.shapes[2]?.top).toBe(80);
  });

  it('sorts unsorted input by top before packing', () => {
    const r = packUp([
      shape('c', 0, 200, 10, 20),
      shape('a', 0, 0, 10, 50),
      shape('b', 0, 100, 10, 30),
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(r.shapes[0]?.top).toBe(0);
    expect(r.shapes[1]?.top).toBe(50);
    expect(r.shapes[2]?.top).toBe(80);
  });

  it('removes overlap between adjacent shapes', () => {
    const r = packUp([shape('a', 0, 0, 10, 50), shape('b', 0, 20, 10, 30)]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes[1]?.top).toBe(50);
  });

  it('preserves left, width, height and ids', () => {
    const a = shape('a', 5, 0, 100, 50);
    const b = shape('b', 7, 100, 200, 30);
    const r = packUp([a, b]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(ids(r.shapes)).toEqual(['a', 'b']);
    expect(r.shapes[0]?.left).toBe(5);
    expect(r.shapes[1]?.left).toBe(7);
  });
});

describe('packLeft — pile collapses to the left', () => {
  it('fails for empty / single', () => {
    expect(packLeft([]).ok).toBe(false);
    expect(packLeft([shape('a', 0, 0, 10, 10)]).ok).toBe(false);
  });

  it('packs shapes leftward against the left-most anchor', () => {
    const a = shape('a', 0, 0, 50, 10);
    const b = shape('b', 100, 0, 30, 10);
    const c = shape('c', 200, 0, 20, 10);
    const r = packLeft([a, b, c]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes[0]?.left).toBe(0);
    expect(r.shapes[1]?.left).toBe(50);
    expect(r.shapes[2]?.left).toBe(80);
  });

  it('sorts unsorted input by left', () => {
    const r = packLeft([
      shape('c', 200, 0, 20, 10),
      shape('a', 0, 0, 50, 10),
      shape('b', 100, 0, 30, 10),
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('removes overlap', () => {
    const r = packLeft([shape('a', 0, 0, 50, 10), shape('b', 20, 0, 30, 10)]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes[1]?.left).toBe(50);
  });

  it('preserves top, width, height, ids', () => {
    const r = packLeft([shape('a', 0, 5, 50, 10), shape('b', 100, 7, 30, 12)]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes[0]?.top).toBe(5);
    expect(r.shapes[1]?.top).toBe(7);
    expect(r.shapes[1]?.width).toBe(30);
    expect(r.shapes[1]?.height).toBe(12);
    expect(ids(r.shapes)).toEqual(['a', 'b']);
  });
});

describe('packRight — pile collapses to the right', () => {
  it('fails for empty / single', () => {
    expect(packRight([]).ok).toBe(false);
    expect(packRight([shape('a', 0, 0, 10, 10)]).ok).toBe(false);
  });

  it('packs shapes rightward against the right-most anchor', () => {
    const a = shape('a', 0, 0, 50, 10);
    const b = shape('b', 100, 0, 30, 10);
    const c = shape('c', 200, 0, 20, 10);
    const r = packRight([a, b, c]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.find((s) => s.id === 'c')?.left).toBe(200);
    expect(r.shapes.find((s) => s.id === 'b')?.left).toBe(170);
    expect(r.shapes.find((s) => s.id === 'a')?.left).toBe(120);
  });

  it('handles unsorted input', () => {
    const r = packRight([
      shape('b', 100, 0, 30, 10),
      shape('c', 200, 0, 20, 10),
      shape('a', 0, 0, 50, 10),
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('removes overlap', () => {
    const r = packRight([shape('a', 30, 0, 50, 10), shape('b', 20, 0, 30, 10)]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.find((s) => s.id === 'a')?.left).toBe(30);
    expect(r.shapes.find((s) => s.id === 'b')?.left).toBe(0);
  });

  it('preserves top, width, height, ids', () => {
    const r = packRight([shape('a', 0, 5, 50, 10), shape('b', 100, 7, 30, 12)]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.find((s) => s.id === 'a')?.top).toBe(5);
    expect(ids(r.shapes)).toEqual(['a', 'b']);
  });
});
