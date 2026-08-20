import { describe, it, expect } from 'vitest';
import { parseFrontmatter, hasExplicitTitle } from './frontmatter';

describe('parseFrontmatter', () => {
  it('解析 title/tags/aliases 并分离正文', () => {
    const src = `---
title: 我的笔记
tags: [a, b]
aliases: [别名A]
---

# 正文标题
内容`;
    const r = parseFrontmatter(src);
    expect(r.title).toBe('我的笔记');
    expect(r.tags).toEqual(['a', 'b']);
    expect(r.aliases).toEqual(['别名A']);
    expect(r.body).toContain('# 正文标题');
  });

  it('无 frontmatter 时返回空值且保留全文', () => {
    const r = parseFrontmatter('# hi');
    expect(r.title).toBeUndefined();
    expect(r.tags).toEqual([]);
    expect(r.body).toBe('# hi');
  });

  it('hasExplicitTitle 仅在有 title 字段时为真', () => {
    expect(hasExplicitTitle('---\ntags: [x]\n---\nbody')).toBe(false);
    expect(hasExplicitTitle('---\ntitle: t\n---\nbody')).toBe(true);
  });
});