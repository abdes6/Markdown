import { fsApi } from './fs';
import { renderMarkdown } from './markdown';
import { useVaultStore } from '../store/vaultStore';

export function wrapHtml(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
body { max-width: 800px; margin: 40px auto; padding: 0 20px; font-family: system-ui, sans-serif; line-height: 1.7; color: #333; }
pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow: auto; }
code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
table { border-collapse: collapse; }
th, td { border: 1px solid #ccc; padding: 6px 10px; }
blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 16px; color: #666; }
img { max-width: 100%; }
</style>
</head>
<body>${body}</body>
</html>`;
}

export async function exportCurrentAsHtml(): Promise<void> {
  const { currentPath, content, notes } = useVaultStore.getState();
  if (!currentPath) throw new Error('没有打开的笔记');
  const meta = notes.find((n) => n.path === currentPath);
  const title = meta?.title ?? currentPath.split(/[\\/]/).pop() ?? 'note';
  const body = await renderMarkdown(content);
  const html = wrapHtml(body, title);
  const out = await pickSavePath(title.replace(/\.md$/i, '') + '.html', 'html');
  if (out) await fsApi.writeFile(out, html);
}

export async function exportZip(): Promise<void> {
  const { vaultPath } = useVaultStore.getState();
  if (!vaultPath) throw new Error('未打开笔记库');
  const out = await pickSavePath('vault-export.zip', 'zip');
  if (out) await fsApi.zipVault(vaultPath, out);
}

export async function exportPdf(): Promise<void> {
  await window.print();
}

async function pickSavePath(defaultName: string, ext: string): Promise<string | null> {
  return await fsApi.saveFile(defaultName, ext);
}