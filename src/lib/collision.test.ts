import { describe, it, expect } from 'vitest';
import { resolveUniqueName } from './collision';

describe('resolveUniqueName', () => {
  it('无冲突直接返回', () => {
    expect(resolveUniqueName(new Set(['a.md']), 'b.md')).toBe('b.md');
  });
  it('同名追加 -1 -2', () => {
    const names = new Set(['a.md', 'a-1.md', 'a-2.md']);
    expect(resolveUniqueName(names, 'a.md')).toBe('a-3.md');
  });
  it('保留扩展名', () => {
    expect(resolveUniqueName(new Set(['a.md']), 'a.md')).toBe('a-1.md');
  });
});