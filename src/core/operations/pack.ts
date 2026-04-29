import type { Shape } from '../types.js';

// FR-1〜FR-4: zero-gap packing along a single axis. The anchor (the shape that
// keeps its original coordinate) is the most-extreme shape in the pack
// direction: pack down anchors the top-most shape, pack up anchors the
// bottom-most, and so on. Other shapes are repositioned so that they touch
// (zero gap, Q2 default).

export function packDown(shapes: readonly Shape[]): Shape[] {
  const [first, ...rest] = [...shapes].sort((a, b) => a.top - b.top);
  if (!first) return [];
  const result: Shape[] = [{ ...first }];
  let cursor = first.top + first.height;
  for (const s of rest) {
    result.push({ ...s, top: cursor });
    cursor += s.height;
  }
  return result;
}

export function packUp(shapes: readonly Shape[]): Shape[] {
  const [last, ...rest] = [...shapes].sort((a, b) => b.top - a.top);
  if (!last) return [];
  const result: Shape[] = [{ ...last }];
  let cursor = last.top;
  for (const s of rest) {
    cursor -= s.height;
    result.push({ ...s, top: cursor });
  }
  result.reverse();
  return result;
}

export function packLeft(shapes: readonly Shape[]): Shape[] {
  const [first, ...rest] = [...shapes].sort((a, b) => a.left - b.left);
  if (!first) return [];
  const result: Shape[] = [{ ...first }];
  let cursor = first.left + first.width;
  for (const s of rest) {
    result.push({ ...s, left: cursor });
    cursor += s.width;
  }
  return result;
}

export function packRight(shapes: readonly Shape[]): Shape[] {
  const [last, ...rest] = [...shapes].sort((a, b) => b.left - a.left);
  if (!last) return [];
  const result: Shape[] = [{ ...last }];
  let cursor = last.left;
  for (const s of rest) {
    cursor -= s.width;
    result.push({ ...s, left: cursor });
  }
  result.reverse();
  return result;
}
