import { useEffect, useRef } from 'react';
import { watch, UnwatchFn } from '@tauri-apps/plugin-fs';
import { useVaultStore } from '../store/vaultStore';

export function useFileWatch() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const unwatch = useRef<UnwatchFn | null>(null);

  useEffect(() => {
    if (!vaultPath) return;
    if (unwatch.current) {
      unwatch.current();
      unwatch.current = null;
    }
    let cancelled = false;
    watch(vaultPath, () => {
      if (cancelled) return;
      useVaultStore.getState().refreshTree();
    }, { recursive: true, delayMs: 400 }).then((fn) => {
      if (cancelled) fn();
      else unwatch.current = fn;
    });
    return () => {
      cancelled = true;
      if (unwatch.current) {
        unwatch.current();
        unwatch.current = null;
      }
    };
  }, [vaultPath]);
}