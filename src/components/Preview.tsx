import { useEffect, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { renderMarkdown } from '../lib/markdown';
import { findNoteByTitle } from '../lib/indexer';

export default function Preview() {
  const content = useVaultStore((s) => s.content);
  const currentPath = useVaultStore((s) => s.currentPath);
  const notes = useVaultStore((s) => s.notes);
  const openNote = useVaultStore((s) => s.openNote);
  const [html, setHtml] = useState('');

  useEffect(() => {
    renderMarkdown(content).then(setHtml);
  }, [content]);

  const onClick = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest('.wikilink') as HTMLElement | null;
    if (!el) return;
    const target = el.dataset.link ?? '';
    const hit = findNoteByTitle(notes, target);
    if (hit) openNote(hit.path);
  };

  if (!currentPath) return <div className="empty">预览将显示在这里</div>;
  return <div className="preview-body" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}