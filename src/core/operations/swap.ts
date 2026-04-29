import type { OperationResult, Shape } from '../types.js';

// FR-6: swap the `left` and `top` of exactly two shapes. Sizes (`width`,
// `height`) and `id` are preserved.

const NEED_EXACTLY_TWO = '位置を入れ替えるには図形をちょうど 2 つ選択してください。';

export function swapPositions(shapes: readonly Shape[]): OperationResult {
  if (shapes.length !== 2) {
    return { ok: false, reason: NEED_EXACTLY_TWO };
  }
  const [a, b] = shapes;
  if (!a || !b) {
    return { ok: false, reason: NEED_EXACTLY_TWO };
  }
  return {
    ok: true,
    shapes: [
      { ...a, left: b.left, top: b.top },
      { ...b, left: a.left, top: a.top },
    ],
  };
}
