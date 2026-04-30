import type { OperationResult, ReferenceShapeResolver, Shape } from '../types.js';

// FR-5 + width-axis sibling: set every shape's height (or width) to the
// reference shape's. For alignHeights, `top` is fixed (shapes grow/shrink
// downward — Q1 default); `left`/`width` are preserved. alignWidths
// mirrors this on the horizontal axis (left fixed, top/height preserved).

type Dimension = 'height' | 'width';

function setDim(s: Shape, dim: Dimension, value: number): Shape {
  return dim === 'height' ? { ...s, height: value } : { ...s, width: value };
}

function align(
  shapes: readonly Shape[],
  resolver: ReferenceShapeResolver,
  dim: Dimension,
): OperationResult {
  if (shapes.length < 2) {
    const what = dim === 'height' ? '高さ' : '幅';
    return { ok: false, reason: `${what}を揃えるには図形を 2 つ以上選択してください。` };
  }
  const reference = resolver.resolve(shapes);
  if (!reference) {
    return { ok: false, reason: '基準図形を判定できませんでした。' };
  }
  const target = reference[dim];
  const out = shapes.map((s) => (s[dim] === target ? s : setDim(s, dim, target)));
  return { ok: true, shapes: out };
}

export function alignHeights(
  shapes: readonly Shape[],
  resolver: ReferenceShapeResolver,
): OperationResult {
  return align(shapes, resolver, 'height');
}

export function alignWidths(
  shapes: readonly Shape[],
  resolver: ReferenceShapeResolver,
): OperationResult {
  return align(shapes, resolver, 'width');
}
