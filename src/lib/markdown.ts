import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

function linkPlugin() {
  return (tree: unknown) => {
    visit(tree as any, 'text', (node: any) => {
      const re = /\[\[([^\[\]]+)\]\]/g;
      if (!re.test(node.value)) return;
      node.type = 'html';
      node.value = node.value.replace(re, (_all: string, inner: string) => {
        const [target, ...rest] = inner.split('|');
        const label = rest.length > 0 ? rest.join('|') : target;
        return `<span class="wikilink" data-link="${target.trim()}" data-label="${label.trim()}">${label.trim()}</span>`;
      });
    });
  };
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(linkPlugin)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(file);
}