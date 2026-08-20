import { useMemo, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';

export default function SearchResults() {
  const [q, setQ] = useState('');
  const notes = useVaultStore((s) => s.notes);
  const openNote = useVaultStore((s) => s.openNote);
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return notes
      .map((n) => {
        const titleHit = n.title.toLowerCase().includes(lower);
        const tagHit = n.tags.some((t) => t.toLowerCase().includes(lower));
        const bodyHit = n.links.some((l) => l.toLowerCase().includes(lower));
        const score = titleHit ? 2 : tagHit ? 1 : bodyHit ? 0 : -1;
        return { n, score };
      })
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score);
  }, [q, notes]);

  return (
    <div>
      <input
        className="search-input"
        placeholder="搜索笔记…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {results.map(({ n }) => (
        <div key={n.path} className="result-item" onClick={() => openNote(n.path)}>
          {n.title}
        </div>
      ))}
    </div>
  );
}