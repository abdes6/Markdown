import { useVaultStore } from '../store/vaultStore';

export default function Toast() {
  const toast = useVaultStore((s) => s.toast);
  if (!toast) return null;
  return <div className={`toast ${toast.type}`}>{toast.message}</div>;
}