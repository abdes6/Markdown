import { useEffect, useRef } from 'react';
import { useVaultStore } from '../store/vaultStore';

export function useAutoSave() {
  const save = useVaultStore((s) => s.save);
  const dirty = useVaultStore((s) => s.dirty);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!dirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      save().catch(() => useVaultStore.getState().showToast('自动保存失败', 'error'));
    }, 500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [dirty, save]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save().catch(() => useVaultStore.getState().showToast('保存失败', 'error'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [save]);
}