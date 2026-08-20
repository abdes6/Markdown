import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Backlinks from './components/Backlinks';
import Toast from './components/Toast';
import Toolbar from './components/Toolbar';
import { useVaultStore } from './store/vaultStore';
import { useFileWatch } from './hooks/useFileWatch';

export default function App() {
  const [rightTab, setRightTab] = useState<'preview' | 'backlinks'>('preview');
  const dirty = useVaultStore((s) => s.dirty);
  const currentPath = useVaultStore((s) => s.currentPath);
  useFileWatch();

  return (
    <div className="app">
      <Sidebar />
      <main className="center">
        <Toolbar />
        <div className="editor">
          <Editor />
        </div>
        <div className="statusbar">
          {currentPath ? `${currentPath.split(/[\\/]/).pop()}${dirty ? ' • 未保存' : ''}` : '未打开笔记'}
        </div>
      </main>
      <aside className="right">
        <div className="right-tabs">
          <button className={`right-tab ${rightTab === 'preview' ? 'active' : ''}`} onClick={() => setRightTab('preview')}>预览</button>
          <button className={`right-tab ${rightTab === 'backlinks' ? 'active' : ''}`} onClick={() => setRightTab('backlinks')}>反向链接</button>
        </div>
        <div className="right-body">
          {rightTab === 'preview' ? <Preview /> : <Backlinks />}
        </div>
      </aside>
      <Toast />
    </div>
  );
}