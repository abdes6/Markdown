import { useMemo, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { searchNotes, SearchableFile } from '../lib/search';

export default function SearchResults() {
  const [q, setQ] = useState('');
  const notes = useVaultStore((s) => s.notes);
  const contentCache = useVaultStore((s) => s.contentCache);
  const openNote = useVaultStore((s) => s.openNote);

  const files = useMemo<SearchableFile[]>(
    () =>
      notes.map((n) => ({
        path: n.path,
        title: n.title,
        tags: n.tags,
        content: contentCache[n.path] ?? '',
      })),
    [notes, contentCache],
  );

  const results = useMemo(() => searchNotes(files, q), [q, files]);

  return (
    <div>
      <input
        className="search-input"
        placeholder="搜索笔记…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {results.map((n) => (
        <div key={n.path} className="result-item" onClick={() => openNote(n.path)}>
          {n.title}
        </div>
      ))}
    </div>
  );
}