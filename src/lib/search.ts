export interface SearchableFile {
  path: string;
  title: string;
  content: string;
  tags: string[];
}

export function searchNotes(
  files: SearchableFile[],
  query: string,
): SearchableFile[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = files
    .map((f) => {
      const titleHit = f.title.toLowerCase().includes(q);
      const contentHit = f.content.toLowerCase().includes(q);
      const tagHit = f.tags.some((t) => t.toLowerCase().includes(q));
      if (!titleHit && !contentHit && !tagHit) return null;
      const score = titleHit ? 2 : tagHit ? 1 : 0;
      return { file: f, score };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score);
  return scored.map((s) => s.file);
}