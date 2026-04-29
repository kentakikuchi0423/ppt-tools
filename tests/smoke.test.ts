import { describe, it, expect } from 'vitest';
import type { Shape } from '../src/core/types';

describe('smoke', () => {
  it('Shape value type can be constructed', () => {
    const s: Shape = { id: 'a', left: 0, top: 0, width: 100, height: 50 };
    expect(s.id).toBe('a');
    expect(s.width * s.height).toBe(5000);
  });
});
