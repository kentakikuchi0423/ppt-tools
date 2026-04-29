import type { OperationResult, ReferenceShapeResolver, Shape } from '../types.js';

// Width-axis sibling of FR-5: set every shape's width to the reference
// shape's width. `left` is fixed (shapes grow/shrink rightward, mirroring
// alignHeights' top-fixed convention). `top` and `height` are preserved.

export function alignWidths(
  shapes: readonly Shape[],
  resolver: ReferenceShapeResolver,
): OperationResult {
  if (shapes.length < 2) {
    return { ok: false, reason: '幅を揃えるには図形を 2 つ以上選択してください。' };
  }
  const reference = resolver.resolve(shapes);
  if (!reference) {
    return { ok: false, reason: '基準図形を判定できませんでした。' };
  }
  const targetWidth = reference.width;
  const out = shapes.map((s) => (s.width === targetWidth ? s : { ...s, width: targetWidth }));
  return { ok: true, shapes: out };
}
