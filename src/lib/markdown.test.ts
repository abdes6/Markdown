import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('渲染标题、列表、粗体', async () => {
    const html = await renderMarkdown('# 标题\n\n- a\n- **b**');
    expect(html).toContain('<h1>标题</h1>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<strong>b</strong>');
  });

  it('渲染 GFM 表格', async () => {
    const html = await renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<table>');
  });

  it('把双链渲染为可点击 span', async () => {
    const html = await renderMarkdown('参考 [[笔记X]]');
    expect(html).toContain('data-link="笔记X"');
  });
});