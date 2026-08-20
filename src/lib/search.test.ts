import { describe, it, expect } from 'vitest';
import { searchNotes } from './search';

const files = [
  { path: 'a.md', title: '项目计划', content: '讨论 roadmap 和 里程碑', tags: ['plan'] },
  { path: 'b.md', title: '日记', content: '今天的 roadmap 笔记', tags: [] },
  { path: 'c.md', title: '备忘', content: '无相关内容', tags: [] },
];

describe('searchNotes', () => {
  it('标题命中优先于正文命中', () => {
    const r = searchNotes(files, '项目');
    expect(r.map((x) => x.path)).toEqual(['a.md']);
  });
  it('正文命中按原顺序返回', () => {
    const r = searchNotes(files, 'roadmap');
    expect(r.map((x) => x.path)).toEqual(['a.md', 'b.md']);
  });
  it('标签命中参与排序（优先于正文）', () => {
    const r = searchNotes(files, 'plan');
    expect(r.map((x) => x.path)).toEqual(['a.md']);
  });
  it('无匹配返回空数组', () => {
    expect(searchNotes(files, '不存在')).toEqual([]);
  });
});