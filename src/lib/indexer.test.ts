import { describe, it, expect } from 'vitest';
import { buildIndex, findNoteByTitle } from './indexer';

const files = [
  {
    path: 'a.md',
    content: '---\ntitle: 笔记A\ntags: [x]\naliases: [A别名]\n---\n正文 [[笔记B]] #y',
  },
  { path: 'sub/b.md', content: '---\ntitle: 笔记B\n---\n反链 [[笔记A]]' },
  { path: 'c.md', content: '普通文件' },
];

describe('buildIndex', () => {
  it('构建标题、标签、链接、反向链接', () => {
    const idx = buildIndex(files);
    const a = idx.find((n) => n.path === 'a.md')!;
    expect(a.title).toBe('笔记A');
    expect(a.tags).toContain('x');
    expect(a.tags).toContain('y');
    expect(a.links).toContain('笔记B');
    expect(a.backlinks).toContain('sub/b.md');
  });

  it('无 frontmatter 时用文件名作标题', () => {
    const idx = buildIndex(files);
    expect(idx.find((n) => n.path === 'c.md')!.title).toBe('c');
  });

  it('aliases 参与反向链接匹配', () => {
    const idx = buildIndex(files);
    expect(idx.find((n) => n.path === 'a.md')!.backlinks).toContain('sub/b.md');
  });
});

describe('findNoteByTitle', () => {
  it('按文件名或别名匹配', () => {
    const idx = buildIndex(files);
    expect(findNoteByTitle(idx, 'A别名')?.path).toBe('a.md');
    expect(findNoteByTitle(idx, '笔记B')?.path).toBe('sub/b.md');
  });
});