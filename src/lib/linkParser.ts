import { parseFrontmatter } from './frontmatter';

export interface LinkRef {
  target: string;
  label: string;
}

function stripCodeFences(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ');
}

export function parseLinks(content: string): LinkRef[] {
  const text = stripCodeFences(content);
  const re = /\[\[([^\[\]]+)\]\]/g;
  const out: LinkRef[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const inner = m[1];
    const [target, ...rest] = inner.split('|');
    const label = rest.length > 0 ? rest.join('|') : target;
    out.push({ target: target.trim(), label: label.trim() });
  }
  return out;
}

export function extractTags(content: string): string[] {
  const text = stripCodeFences(content)
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/\[\[[^\]]*\]\]/g, '');
  const fm = parseFrontmatter(content);
  const inline = Array.from(
    text.matchAll(/(?:^|\s)#([\p{L}\p{N}_-]+)/gu),
    (m) => m[1],
  );
  return Array.from(new Set([...fm.tags, ...inline]));
}