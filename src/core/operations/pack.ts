import type { OperationResult, Shape } from '../types.js';

// FR-1〜FR-4: zero-gap packing along a single axis. The anchor (the shape
// whose coordinate stays fixed) is the shape closest to the side named in
// the operation:
//   packDown  → bottom-most stays, others move down to it (pile collapses to the bottom)
//   packUp    → top-most stays, others move up to it (pile collapses to the top)
//   packLeft  → left-most stays, others move left to it
//   packRight → right-most stays, others move right to it
// Other shapes are repositioned so they touch (zero gap, Q2 default).

const NEED_TWO_FOR_PACK = '詰めるには図形を 2 つ以上選択してください。';

export function packDown(shapes: readonly Shape[]): OperationResult {
  if (shapes.length < 2) return { ok: false, reason: NEED_TWO_FOR_PACK };
  const [last, ...rest] = [...shapes].sort((a, b) => b.top - a.top);
  if (!last) return { ok: false, reason: NEED_TWO_FOR_PACK };
  const result: Shape[] = [{ ...last }];
  let cursor = last.top;
  for (const s of rest) {
    cursor -= s.height;
    result.push({ ...s, top: cursor });
  }
  result.reverse();
  return { ok: true, shapes: result };
}

export function packUp(shapes: readonly Shape[]): OperationResult {
  if (shapes.length < 2) return { ok: false, reason: NEED_TWO_FOR_PACK };
  const [first, ...rest] = [...shapes].sort((a, b) => a.top - b.top);
  if (!first) return { ok: false, reason: NEED_TWO_FOR_PACK };
  const result: Shape[] = [{ ...first }];
  let cursor = first.top + first.height;
  for (const s of rest) {
    result.push({ ...s, top: cursor });
    cursor += s.height;
  }
  return { ok: true, shapes: result };
}

export function packLeft(shapes: readonly Shape[]): OperationResult {
  if (shapes.length < 2) return { ok: false, reason: NEED_TWO_FOR_PACK };
  const [first, ...rest] = [...shapes].sort((a, b) => a.left - b.left);
  if (!first) return { ok: false, reason: NEED_TWO_FOR_PACK };
  const result: Shape[] = [{ ...first }];
  let cursor = first.left + first.width;
  for (const s of rest) {
    result.push({ ...s, left: cursor });
    cursor += s.width;
  }
  return { ok: true, shapes: result };
}

export function packRight(shapes: readonly Shape[]): OperationResult {
  if (shapes.length < 2) return { ok: false, reason: NEED_TWO_FOR_PACK };
  const [last, ...rest] = [...shapes].sort((a, b) => b.left - a.left);
  if (!last) return { ok: false, reason: NEED_TWO_FOR_PACK };
  const result: Shape[] = [{ ...last }];
  let cursor = last.left;
  for (const s of rest) {
    cursor -= s.width;
    result.push({ ...s, left: cursor });
  }
  result.reverse();
  return { ok: true, shapes: result };
}
