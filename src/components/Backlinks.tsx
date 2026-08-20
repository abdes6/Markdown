import { useVaultStore } from '../store/vaultStore';

export default function Backlinks() {
  const currentPath = useVaultStore((s) => s.currentPath);
  const notes = useVaultStore((s) => s.notes);
  const openNote = useVaultStore((s) => s.openNote);
  if (!currentPath) return null;
  const current = notes.find((n) => n.path === currentPath);
  if (!current || current.backlinks.length === 0) return <div className="empty">暂无反向链接</div>;
  return (
    <div>
      {current.backlinks.map((p) => {
        const meta = notes.find((n) => n.path === p)!;
        return (
          <div key={p} className="result-item" onClick={() => openNote(p)}>
            {meta.title}
          </div>
        );
      })}
    </div>
  );
}