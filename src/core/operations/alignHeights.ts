import type { OperationResult, ReferenceShapeResolver, Shape } from '../types.js';

// FR-5: set every shape's height to the reference shape's height.
// `top` is fixed (Q1 default — shapes grow/shrink downward). `left` and
// `width` are preserved.

export function alignHeights(
  shapes: readonly Shape[],
  resolver: ReferenceShapeResolver,
): OperationResult {
  if (shapes.length < 2) {
    return { ok: false, reason: '高さを揃えるには図形を 2 つ以上選択してください。' };
  }
  const reference = resolver.resolve(shapes);
  if (!reference) {
    return { ok: false, reason: '基準図形を判定できませんでした。' };
  }
  const targetHeight = reference.height;
  const out = shapes.map((s) => (s.height === targetHeight ? s : { ...s, height: targetHeight }));
  return { ok: true, shapes: out };
}
