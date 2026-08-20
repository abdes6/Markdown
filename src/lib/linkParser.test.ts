import { describe, it, expect } from 'vitest';
import { parseLinks, extractTags } from './linkParser';

describe('parseLinks', () => {
  it('解析基本双链', () => {
    const links = parseLinks('看 [[笔记A]] 和 [[笔记B|显示B]]');
    expect(links).toEqual([
      { target: '笔记A', label: '笔记A' },
      { target: '笔记B', label: '显示B' },
    ]);
  });

  it('忽略代码块与行内代码中的链接', () => {
    const src = '```\n[[不该解析]]\n```\n`[[也不该]]` 正常[[该解析]]';
    const links = parseLinks(src);
    expect(links.map((l) => l.target)).toEqual(['该解析']);
  });
});

describe('extractTags', () => {
  it('提取行内标签（不含 # 号）', () => {
    expect(extractTags('正文 #react 和 #typescript 测试')).toEqual([
      'react',
      'typescript',
    ]);
  });

  it('不提取标题或链接内的井号', () => {
    expect(extractTags('## 标题')).toEqual([]);
  });
});