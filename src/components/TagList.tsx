import { useMemo } from 'react';
import { useVaultStore } from '../store/vaultStore';

export default function TagList() {
  const notes = useVaultStore((s) => s.notes);
  const openNote = useVaultStore((s) => s.openNote);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of notes) for (const t of n.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [notes]);

  if (counts.length === 0) return <div className="empty">暂无标签</div>;
  return (
    <div>
      {counts.map(([tag, count]) => (
        <div
          key={tag}
          className="tag-item"
          onClick={() => openNote(notes.find((n) => n.tags.includes(tag))!.path)}
        >
          #{tag} <span style={{ color: '#999' }}>{count}</span>
        </div>
      ))}
    </div>
  );
}