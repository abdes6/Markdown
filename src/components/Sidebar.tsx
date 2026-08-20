import { useState } from 'react';
import FileTree from './FileTree';
import TagList from './TagList';
import SearchResults from './SearchResults';

export default function Sidebar() {
  const [tab, setTab] = useState<'files' | 'tags' | 'search'>('files');
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className={`sidebar-tab ${tab === 'files' ? 'active' : ''}`} onClick={() => setTab('files')}>文件</button>
        <button className={`sidebar-tab ${tab === 'tags' ? 'active' : ''}`} onClick={() => setTab('tags')}>标签</button>
        <button className={`sidebar-tab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>搜索</button>
      </div>
      <div className="sidebar-body">
        {tab === 'files' && <FileTree />}
        {tab === 'tags' && <TagList />}
        {tab === 'search' && <SearchResults />}
      </div>
    </aside>
  );
}