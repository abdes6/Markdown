export interface Frontmatter {
  title?: string;
  tags: string[];
  aliases: string[];
  body: string;
  raw: string;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseTags(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseYamlList(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }
  return trimmed
    .split('\n')
    .map((s) => s.replace(/^\s*-\s*/, '').trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

export function parseFrontmatter(content: string): Frontmatter {
  const m = content.match(FM_RE);
  if (!m) {
    return { tags: [], aliases: [], body: content, raw: '' };
  }
  const raw = m[1];
  const body = content.slice(m[0].length);
  let title: string | undefined;
  let tags: string[] = [];
  let aliases: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const tm = line.match(/^title\s*:\s*(.+)$/);
    if (tm) {
      title = tm[1].trim().replace(/^['"]|['"]$/g, '');
      continue;
    }
    const tgm = line.match(/^tags\s*:\s*(.+)$/);
    if (tgm) {
      tags = parseTags(tgm[1]);
      continue;
    }
    const alm = line.match(/^aliases\s*:\s*(.+)$/);
    if (alm) {
      aliases = parseYamlList(alm[1]);
      continue;
    }
  }
  return { title, tags, aliases, body, raw };
}

export function hasExplicitTitle(content: string): boolean {
  return /^---\r?\n[\s\S]*?^title\s*:/m.test(content);
}