import { useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { fsApi, TreeNode } from '../lib/fs';
import { resolveUniqueName } from '../lib/collision';

function NodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const currentPath = useVaultStore((s) => s.currentPath);
  const openNote = useVaultStore((s) => s.openNote);
  const refreshTree = useVaultStore((s) => s.refreshTree);
  const showToast = useVaultStore((s) => s.showToast);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const [expanded, setExpanded] = useState(true);

  if (node.is_dir) {
    return (
      <div>
        <div
          className="file-tree-item"
          style={{ paddingLeft: depth * 14 + 8 }}
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? '▾' : '▸'}</span> {node.name}
        </div>
        {expanded && node.children.map((c) => <NodeItem key={c.path} node={c} depth={depth + 1} />)}
      </div>
    );
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const action = prompt('输入操作：\n1=重命名\n2=删除');
    if (action === '1') {
      const name = prompt('新文件名（含 .md）', node.name);
      if (name && vaultPath) {
        const parent = node.path.slice(0, node.path.length - node.name.length);
        fsApi
          .renameFile(node.path, parent + name)
          .then(refreshTree)
          .catch((err) => showToast(String(err), 'error'));
      }
    } else if (action === '2') {
      if (confirm(`删除 ${node.name}？`)) {
        fsApi
          .deleteFile(node.path)
          .then(refreshTree)
          .catch((err) => showToast(String(err), 'error'));
      }
    }
  };

  return (
    <div
      className={`file-tree-item ${currentPath === node.path ? 'active' : ''}`}
      style={{ paddingLeft: depth * 14 + 8 }}
      onClick={() => openNote(node.path)}
      onContextMenu={handleContextMenu}
    >
      {node.name}
    </div>
  );
}

function allNames(nodes: TreeNode[]): string[] {
  return nodes.flatMap((n) => (n.is_dir ? allNames(n.children) : [n.name]));
}

export default function FileTree() {
  const tree = useVaultStore((s) => s.tree);
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const refreshTree = useVaultStore((s) => s.refreshTree);
  const openVault = useVaultStore((s) => s.openVault);
  const showToast = useVaultStore((s) => s.showToast);
  const [newName, setNewName] = useState('');

  if (!vaultPath) {
    return (
      <div className="empty">
        <p>尚未打开笔记库</p>
        <button onClick={openVault}>打开笔记库文件夹</button>
      </div>
    );
  }

  const createNote = async () => {
    if (!newName.trim()) return;
    try {
      const names = new Set(allNames(tree));
      const unique = resolveUniqueName(
        names,
        newName.trim().endsWith('.md') ? newName.trim() : `${newName.trim()}.md`,
      );
      const created = await fsApi.createFile(vaultPath, unique);
      setNewName('');
      await refreshTree();
      useVaultStore.getState().openNote(created);
    } catch (err) {
      showToast(String(err), 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <input
          value={newName}
          placeholder="新笔记名"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && createNote()}
          style={{ flex: 1, padding: 6 }}
        />
        <button onClick={createNote}>+</button>
      </div>
      {tree.map((n) => <NodeItem key={n.path} node={n} depth={0} />)}
    </div>
  );
}