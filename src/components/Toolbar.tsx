import { useVaultStore } from '../store/vaultStore';
import { fsApi } from '../lib/fs';
import { resolveUniqueName } from '../lib/collision';
import { exportCurrentAsHtml, exportZip, exportPdf } from '../lib/export';

export default function Toolbar() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const refreshTree = useVaultStore((s) => s.refreshTree);
  const showToast = useVaultStore((s) => s.showToast);
  const currentPath = useVaultStore((s) => s.currentPath);

  const onImport = async () => {
    if (!vaultPath) return showToast('请先打开笔记库', 'error');
    const file = await fsApi.pickFile();
    if (!file) return;
    const name = file.split(/[\\/]/).pop()!;
    const tree = JSON.parse(await fsApi.listFiles(vaultPath)) as { name: string }[];
    const names = new Set(tree.map((t) => t.name));
    const unique = resolveUniqueName(names, name);
    const target = `${vaultPath.replace(/\\/g, '/')}/${unique}`;
    const content = await fsApi.readFile(file);
    await fsApi.writeFile(target, content);
    await refreshTree();
    showToast(`已导入 ${unique}`);
  };

  return (
    <div className="toolbar">
      <button disabled={!vaultPath} onClick={onImport}>导入 Markdown</button>
      <button disabled={!currentPath} onClick={exportCurrentAsHtml}>导出 HTML</button>
      <button disabled={!currentPath} onClick={exportPdf}>导出 PDF</button>
      <button disabled={!vaultPath} onClick={exportZip}>导出库 ZIP</button>
    </div>
  );
}