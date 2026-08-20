import { invoke } from '@tauri-apps/api/core';

export interface TreeNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: TreeNode[];
}

export const fsApi = {
  pickFolder: () => invoke<string | null>('pick_folder'),
  pickFile: () => invoke<string | null>('pick_file'),
  listFiles: (root: string) => invoke<string>('list_files_cmd', { root }),
  readFile: (path: string) => invoke<string>('read_file_cmd', { path }),
  writeFile: (path: string, content: string) =>
    invoke<void>('write_file_cmd', { path, content }),
  createFile: (dir: string, name: string) =>
    invoke<string>('create_file_cmd', { dir, name }),
  renameFile: (oldPath: string, newPath: string) =>
    invoke<void>('rename_file_cmd', { old: oldPath, new: newPath }),
  deleteFile: (path: string) => invoke<void>('delete_file_cmd', { path }),
  createDir: (parent: string, name: string) =>
    invoke<void>('create_dir_cmd', { parent, name }),
  zipVault: (root: string, out: string) =>
    invoke<void>('zip_vault_cmd', { root, out }),
  readVaultConfig: (root: string) =>
    invoke<string>('read_vault_config_cmd', { root }),
  writeVaultConfig: (root: string, config: string) =>
    invoke<void>('write_vault_config_cmd', { root, config }),
};