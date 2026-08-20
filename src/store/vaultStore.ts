import { create } from 'zustand';
import { fsApi, TreeNode } from '../lib/fs';
import { buildIndex, NoteMeta } from '../lib/indexer';

interface Toast {
  id: number;
  message: string;
  type: 'error' | 'info';
}

interface VaultState {
  vaultPath: string | null;
  tree: TreeNode[];
  notes: NoteMeta[];
  currentPath: string | null;
  content: string;
  savedContent: string;
  dirty: boolean;
  contentCache: Record<string, string>;
  toast: Toast | null;
  openVault: () => Promise<void>;
  openNote: (path: string) => Promise<void>;
  setContent: (content: string) => void;
  save: () => Promise<boolean>;
  showToast: (message: string, type?: Toast['type']) => void;
  clearToast: () => void;
  refreshTree: () => Promise<void>;
}

let toastId = 0;

async function loadFiles(tree: TreeNode[]): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];
  const walk = (nodes: TreeNode[]) => {
    for (const n of nodes) {
      if (n.is_dir) walk(n.children);
      else files.push({ path: n.path, content: '' });
    }
  };
  walk(tree);
  for (const f of files) {
    f.content = await fsApi.readFile(f.path);
  }
  return files;
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vaultPath: null,
  tree: [],
  notes: [],
  currentPath: null,
  content: '',
  savedContent: '',
  dirty: false,
  contentCache: {},
  toast: null,

  showToast: (message, type = 'info') => {
    const id = ++toastId;
    set({ toast: { id, message, type } });
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null });
    }, 4000);
  },

  clearToast: () => set({ toast: null }),

  openVault: async () => {
    try {
      const dir = await fsApi.pickFolder();
      if (!dir) return;
      const tree = JSON.parse(await fsApi.listFiles(dir)) as TreeNode[];
      const files = await loadFiles(tree);
      const notes = buildIndex(files);
      const contentCache: Record<string, string> = {};
      for (const f of files) contentCache[f.path] = f.content;
      set({
        vaultPath: dir,
        tree,
        notes,
        contentCache,
        currentPath: null,
        content: '',
        savedContent: '',
        dirty: false,
      });
      get().refreshTree();
    } catch (err) {
      get().showToast(`打开笔记库失败：${err}`, 'error');
    }
  },

  openNote: async (path: string) => {
    try {
      const cache = get().contentCache[path];
      const content = cache ?? (await fsApi.readFile(path));
      set({ currentPath: path, content, savedContent: content, dirty: false });
    } catch (err) {
      get().showToast(`无法打开文件：${err}`, 'error');
    }
  },

  setContent: (content: string) =>
    set({ content, dirty: content !== get().savedContent }),

  save: async () => {
    const { currentPath, content } = get();
    if (!currentPath) return false;
    try {
      await fsApi.writeFile(currentPath, content);
      const contentCache = { ...get().contentCache, [currentPath]: content };
      set({ savedContent: content, dirty: false, contentCache });
      get().refreshTree();
      return true;
    } catch (err) {
      get().showToast(`保存失败：${err}`, 'error');
      return false;
    }
  },

  refreshTree: async () => {
    const { vaultPath } = get();
    if (!vaultPath) return;
    try {
      const tree = JSON.parse(await fsApi.listFiles(vaultPath)) as TreeNode[];
      const files = await loadFiles(tree);
      const notes = buildIndex(files);
      const contentCache: Record<string, string> = {};
      for (const f of files) contentCache[f.path] = f.content;
      set({ tree, notes, contentCache });
    } catch (err) {
      get().showToast(`刷新笔记库失败：${err}`, 'error');
    }
  },
}));