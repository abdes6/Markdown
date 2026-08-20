import { parseFrontmatter } from './frontmatter';
import { parseLinks, extractTags } from './linkParser';

export interface NoteMeta {
  path: string;
  title: string;
  tags: string[];
  aliases: string[];
  links: string[];
  backlinks: string[];
  updatedAt: number;
  wordCount: number;
}

export interface IndexInput {
  path: string;
  content: string;
}

function titleFromPath(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path;
  return base.replace(/\.md$/i, '');
}

function wordCount(content: string): number {
  const text = content
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/[#*`>\[\]|]/g, ' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function buildIndex(files: IndexInput[]): NoteMeta[] {
  const metas: NoteMeta[] = files.map((f) => {
    const fm = parseFrontmatter(f.content);
    const links = parseLinks(f.content).map((l) => l.target);
    return {
      path: f.path,
      title: fm.title ?? titleFromPath(f.path),
      tags: extractTags(f.content),
      aliases: fm.aliases,
      links,
      backlinks: [],
      updatedAt: 0,
      wordCount: wordCount(f.content),
    };
  });

  const lookup = new Map<string, NoteMeta>();
  for (const m of metas) {
    lookup.set(m.title, m);
    for (const a of m.aliases) lookup.set(a, m);
  }

  for (const m of metas) {
    const targets = new Set(m.links);
    for (const t of targets) {
      const hit = lookup.get(t);
      if (hit && hit.path !== m.path && !hit.backlinks.includes(m.path)) {
        hit.backlinks.push(m.path);
      }
    }
  }
  return metas;
}

export function findNoteByTitle(
  notes: NoteMeta[],
  target: string,
): NoteMeta | undefined {
  const normalized = target.trim();
  return notes.find(
    (n) =>
      n.title === normalized ||
      n.aliases.includes(normalized) ||
      titleFromPath(n.path) === normalized,
  );
}