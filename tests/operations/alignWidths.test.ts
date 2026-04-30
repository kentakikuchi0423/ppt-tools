import { describe, expect, it } from 'vitest';
import { alignWidths } from '../../src/core/operations/align.js';
import { LastSelectedResolver } from '../../src/core/resolvers/lastSelected.js';
import { StoredReferenceResolver } from '../../src/core/resolvers/storedReference.js';
import type { ReferenceShapeResolver, Shape } from '../../src/core/types.js';

const shape = (id: string, width: number): Shape => ({
  id,
  left: 10,
  top: 20,
  width,
  height: 30,
});

const undefinedResolver: ReferenceShapeResolver = { resolve: () => undefined };

describe('alignWidths', () => {
  it('fails for empty input', () => {
    expect(alignWidths([], LastSelectedResolver).ok).toBe(false);
  });

  it('fails for a single shape', () => {
    expect(alignWidths([shape('a', 50)], LastSelectedResolver).ok).toBe(false);
  });

  it('fails when the resolver returns undefined', () => {
    const r = alignWidths([shape('a', 50), shape('b', 60)], undefinedResolver);
    expect(r.ok).toBe(false);
  });

  it('aligns all shapes to the last-selected reference width', () => {
    const r = alignWidths([shape('a', 50), shape('b', 60), shape('c', 70)], LastSelectedResolver);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.map((s) => s.width)).toEqual([70, 70, 70]);
  });

  it('preserves top, left, height, and id on all shapes', () => {
    const a: Shape = { id: 'a', left: 1, top: 2, width: 3, height: 4 };
    const b: Shape = { id: 'b', left: 5, top: 6, width: 7, height: 8 };
    const r = alignWidths([a, b], LastSelectedResolver);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes[0]).toEqual({ ...a, width: 7 });
    expect(r.shapes[1]).toEqual(b);
  });

  it('leaves the reference shape unchanged', () => {
    const a = shape('a', 50);
    const ref = shape('ref', 80);
    const r = alignWidths([a, ref], LastSelectedResolver);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.find((s) => s.id === 'ref')).toEqual(ref);
  });

  it('uses StoredReferenceResolver to find the reference by id', () => {
    const resolver = new StoredReferenceResolver('b');
    const r = alignWidths([shape('a', 50), shape('b', 60), shape('c', 70)], resolver);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.shapes.every((s) => s.width === 60)).toBe(true);
  });

  it('fails when the StoredReferenceResolver id is missing from selection', () => {
    const resolver = new StoredReferenceResolver('missing');
    const r = alignWidths([shape('a', 50), shape('b', 60)], resolver);
    expect(r.ok).toBe(false);
  });
});
