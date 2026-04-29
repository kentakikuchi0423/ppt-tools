import type { OperationResult, ReferenceShapeResolver, Shape } from '../types.js';

// FR-5: set every shape's height to the reference shape's height.
// `top` is fixed (Q1 default — shapes grow/shrink downward). `left` and
// `width` are preserved.
//
// Selection-count rule: < 2 shapes is a no-op (the user can't have selected a
// reference plus a target). If the resolver fails to pick a reference (e.g.
// a stale stored ID that no longer matches any selected shape), also fail.

export function alignHeights(
  shapes: readonly Shape[],
  resolver: ReferenceShapeResolver,
): OperationResult {
  if (shapes.length < 2) {
    return { ok: false, reason: 'Select 2 or more shapes to align heights.' };
  }
  const reference = resolver.resolve(shapes);
  if (!reference) {
    return { ok: false, reason: 'Could not determine the reference shape.' };
  }
  const targetHeight = reference.height;
  const out = shapes.map((s) => (s.height === targetHeight ? s : { ...s, height: targetHeight }));
  return { ok: true, shapes: out };
}
