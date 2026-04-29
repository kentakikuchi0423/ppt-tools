import { describe, expect, it } from 'vitest';
import { alignHeights } from '../../src/core/operations/alignHeights.js';
import { LastSelectedResolver } from '../../src/core/resolvers/lastSelected.js';
import { StoredReferenceResolver } from '../../src/core/resolvers/storedReference.js';
import type { ReferenceShapeResolver, Shape } from '../../src/core/types.js';

const shape = (id: string, height: number): Shape => ({
  id,
  left: 10,
  top: 20,
  width: 100,
  height,
});

const undefinedResolver: ReferenceShapeResolver = { resolve: () => undefined };

describe('alignHeights', () => {
  it('fails for empty input', () => {
    const r = alignHeights([], LastSelectedResolver);
    expect(r.ok).toBe(false);
  });

  it('fails for a single shape', () => {
    const r = alignHeights([shape('a', 50)], LastSelectedResolver);
    expect(r.ok).toBe(false);
  });

  it('fails when the resolver returns undefined', () => {
    const r = alignHeights([shape('a', 50), shape('b', 60)], undefinedResolver);
    expect(r.ok).toBe(false);
  });

  it('aligns all shapes to the last-selected reference height', () => {
    const r = alignHeights([shape('a', 50), shape('b', 60), shape('c', 70)], LastSelectedResolver);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.map((s) => s.height)).toEqual([70, 70, 70]);
  });

  it('preserves top, left, width, and id on all shapes', () => {
    const a: Shape = { id: 'a', left: 1, top: 2, width: 3, height: 50 };
    const b: Shape = { id: 'b', left: 4, top: 5, width: 6, height: 60 };
    const r = alignHeights([a, b], LastSelectedResolver);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes[0]).toEqual({ ...a, height: 60 });
    expect(r.shapes[1]).toEqual(b);
  });

  it('leaves the reference shape unchanged', () => {
    const a = shape('a', 50);
    const ref = shape('ref', 80);
    const r = alignHeights([a, ref], LastSelectedResolver);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.find((s) => s.id === 'ref')).toEqual(ref);
  });

  it('uses StoredReferenceResolver to find the reference by id', () => {
    const a = shape('a', 50);
    const b = shape('b', 60);
    const c = shape('c', 70);
    const resolver = new StoredReferenceResolver('b');
    const r = alignHeights([a, b, c], resolver);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.every((s) => s.height === 60)).toBe(true);
  });

  it('fails when the StoredReferenceResolver id is missing from selection', () => {
    const resolver = new StoredReferenceResolver('missing');
    const r = alignHeights([shape('a', 50), shape('b', 60)], resolver);
    expect(r.ok).toBe(false);
  });
});

describe('LastSelectedResolver', () => {
  it('returns undefined for empty input', () => {
    expect(LastSelectedResolver.resolve([])).toBeUndefined();
  });

  it('returns the last shape', () => {
    const a = shape('a', 50);
    const b = shape('b', 60);
    expect(LastSelectedResolver.resolve([a, b])).toEqual(b);
  });
});

describe('StoredReferenceResolver', () => {
  it('returns the matching shape', () => {
    const a = shape('a', 50);
    const b = shape('b', 60);
    const r = new StoredReferenceResolver('a');
    expect(r.resolve([a, b])).toEqual(a);
  });

  it('returns undefined when the id is not in the selection', () => {
    const r = new StoredReferenceResolver('missing');
    expect(r.resolve([shape('a', 50)])).toBeUndefined();
  });
});
