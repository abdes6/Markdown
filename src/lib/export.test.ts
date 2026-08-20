import { describe, it, expect } from 'vitest';
import { wrapHtml } from './export';

describe('wrapHtml', () => {
  it('生成含样式与内容的完整 HTML', () => {
    const html = wrapHtml('<h1>标题</h1>', '笔记标题');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<h1>标题</h1>');
    expect(html).toContain('<title>笔记标题</title>');
  });
});