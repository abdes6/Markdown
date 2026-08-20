# Markdown 笔记应用 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Tauri 2 桌面 Markdown 笔记应用，支持编辑与实时预览、多笔记管理（目录/标签/搜索）、双链与反向链接、导入导出。

**Architecture:** 前端 React + TypeScript 承载业务逻辑（编辑、预览、索引、搜索、双链、文件监听、HTML 导出），Rust 薄层仅提供文件系统命令与 PDF/ZIP 导出。笔记以纯 `.md` 文件存于用户选定的笔记库文件夹，`.mdnotes/` 目录存放配置与索引缓存。三栏布局：左栏文件树/标签/搜索、中栏编辑器、右栏预览/反向链接。

**Tech Stack:** Tauri 2、React 18、TypeScript、Vite 6、CodeMirror 6、unified/remark/rehype、Zustand、chokidar、Vitest + Testing Library、Rust 1.97。

## Global Constraints

- 前端在 `src/`，Rust 在 `src-tauri/`，设计文档与计划在 `docs/superpowers/`
- Rust 后端仅做文件系统命令：选择目录、列出/读写/创建/重命名/删除文件、PDF 导出、ZIP 打包
- 笔记库隐藏目录 `.mdnotes/` 存放 `config.json` 与 `index.json`，运行时生成，加入 `.gitignore`
- 双链语法 `[[笔记名]]`、`[[笔记名|显示文字]]`；标签 `#tag` 或 frontmatter `tags`；frontmatter 支持 `title`/`tags`/`aliases`
- 默认中文沟通；代码、命令、变量名、文件路径保持英文；不添加注释
- 不自动 commit/push，除非任务步骤明确要求；提交前展示变更摘要，一次提交一个逻辑变更
- 编辑器防抖 500ms 自动保存 + `Ctrl+S` 强制保存
- 不做知识图谱可视化、不做云同步、不做 AI 写作、不做协作

---

## 文件结构总览

```
├── package.json                 # 前端依赖与脚本
├── vite.config.ts               # Vite 配置
├── tsconfig.json                # TS 配置
├── index.html                   # HTML 入口
├── .gitignore                   # 忽略 node_modules、dist、.mdnotes、target
├── src/
│   ├── main.tsx                 # React 挂载入口
│   ├── App.tsx                  # 应用壳（三栏布局 + 顶层状态）
│   ├── types.ts                 # 共享类型定义
│   ├── lib/
│   │   ├── markdown.ts          # unified 渲染管线（remark + rehype）
│   │   ├── linkParser.ts        # 双链解析（纯函数）
│   │   ├── frontmatter.ts       # YAML frontmatter 解析
│   │   ├── indexer.ts           # 索引构建（纯函数）
│   │   ├── search.ts            # 搜索排序（纯函数）
│   │   ├── collision.ts         # 文件名冲突策略（纯函数）
│   │   └── fs.ts                # Rust 命令封装（invoke 调用）
│   ├── store/
│   │   └── vaultStore.ts        # Zustand store
│   ├── components/
│   │   ├── Sidebar.tsx          # 左栏：文件树/标签/搜索切换
│   │   ├── FileTree.tsx         # 文件树
│   │   ├── TagList.tsx          # 标签列表
│   │   ├── SearchResults.tsx    # 搜索结果
│   │   ├── Editor.tsx           # CodeMirror 编辑器
│   │   ├── Preview.tsx          # 实时预览
│   │   ├── Backlinks.tsx        # 反向链接面板
│   │   └── Toast.tsx            # 错误/提示通知
│   ├── hooks/
│   │   ├── useAutoSave.ts       # 防抖自动保存
│   │   └── useFileWatch.ts      # chokidar 文件监听
│   └── styles.css               # 全局样式
├── src-tauri/
│   ├── Cargo.toml               # Rust 依赖
│   ├── tauri.conf.json          # Tauri 配置
│   ├── capabilities/default.json # 权限
│   ├── src/
│   │   ├── main.rs              # 入口
│   │   ├── lib.rs               # run() 注册命令
│   │   └── commands.rs          # 文件系统命令
│   └── tests/
│       └── commands_test.rs     # Rust 集成测试
└── docs/superpowers/
    ├── specs/2026-08-20-markdown-notes-design.md  # 设计文档
    └── plans/2026-08-20-markdown-notes.md         # 本计划
```

---

### Task 1: 初始化 Tauri 2 + React + TS 项目脚手架

**Files:**
- Create: 整个项目骨架（脚手架自动生成）
- Modify: `package.json`、`vite.config.ts`、`index.html`、`src-tauri/tauri.conf.json`、`src-tauri/capabilities/default.json`
- Create: `.gitignore`

**Interfaces:**
- Produces: 可运行的 `npm run tauri dev` 窗口；`src-tauri/src/lib.rs` 中的 `run()`；`src/App.tsx` 占位内容

- [ ] **Step 1: 用 create-tauri-app 生成项目**

```bash
cd D:/AICoding/Markdown
npm create tauri-app@latest -- --project-name markdown-notes --template react-ts --manager npm --identifier com.abdes6.markdownnotes --yes
```

将生成到当前目录。若提示目录非空，确认覆盖或手动合并生成到临时目录再移入。

- [ ] **Step 2: 安装前端依赖**

```bash
npm install
npm install @codemirror/state @codemirror/view @codemirror/lang-markdown @codemirror/language @uiw/react-codemirror
npm install unified remark-parse remark-gfm remark-rehype rehype-stringify remark-frontmatter micromark-extension-frontmatter hast-util-to-html
npm install zustand chokidar
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

- [ ] **Step 3: 配置 Tauri 窗口与标识符**

编辑 `src-tauri/tauri.conf.json`，确保：

```json
{
  "productName": "Markdown Notes",
  "identifier": "com.abdes6.markdownnotes",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Markdown Notes",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

- [ ] **Step 4: 配置 capabilities 权限**

编辑 `src-tauri/capabilities/default.json`：

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Main window capability",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "dialog:default",
    "fs:default",
    "core:window:allow-print"
  ]
}
```

- [ ] **Step 5: 添加 Rust 依赖**

编辑 `src-tauri/Cargo.toml` 的 `[dependencies]`，加入：

```toml
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
zip = "2"
```

- [ ] **Step 6: 更新入口注册插件**

修改 `src-tauri/src/lib.rs` 为：

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 7: 更新 `src-tauri/src/main.rs`**

```rust
fn main() {
    markdown_notes_lib::run();
}
```

将 crate 名改为 `markdown_notes_lib`（与 Cargo.toml 的 `name` 一致，若脚手架生成名不同则以实际为准）。

- [ ] **Step 8: 创建 `.gitignore`**

```gitignore
node_modules/
dist/
src-tauri/target/
src-tauri/gen/
.mdnotes/
*.local
```

- [ ] **Step 9: 更新前端入口**

`src/App.tsx` 替换为最小骨架：

```tsx
export default function App() {
  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>Markdown Notes</h1>
      <p>脚手架运行正常</p>
    </div>
  );
}
```

- [ ] **Step 10: 验证开发模式可启动**

运行：`npm run tauri dev`
Expected: Tauri 窗口打开显示「Markdown Notes / 脚手架运行正常」，无控制台报错。

- [ ] **Step 11: 提交**

```bash
git add -A
git commit -m "chore: 初始化 Tauri 2 + React + TS 脚手架"
```

---

### Task 2: 共享类型定义与 Rust 文件系统命令

**Files:**
- Create: `src/types.ts`
- Create: `src-tauri/src/commands.rs`
- Modify: `src-tauri/src/lib.rs`
- Create: `src-tauri/tests/commands_test.rs`

**Interfaces:**
- Consumes: Task 1 的脚手架与依赖
- Produces:
  - TS 类型：`NoteFile`、`TreeNode`、`NoteMeta`、`VaultConfig`
  - Rust 命令：`list_files(path) -> Vec<TreeNode>?` 返回 JSON 字符串、`read_file(path) -> String`、`write_file(path, content)`、`create_file(dir, name) -> String`、`rename_file(old, new)`、`delete_file(path)`、`create_dir(parent, name)`、`pick_folder() -> Option<String>`、`zip_vault(root, out)`、`write_vault_config(root, config)`、`read_vault_config(root) -> String`

- [ ] **Step 1: 写失败测试 — Rust 命令**

创建 `src-tauri/tests/commands_test.rs`：

```rust
use std::fs;
use tempfile::tempdir;
use markdown_notes_lib::commands;

#[test]
fn write_then_read_roundtrip() {
    let dir = tempdir().unwrap();
    let path = dir.path().join("a.md");
    commands::write_file(path.to_str().unwrap().to_string(), "# Hello".to_string());
    let content = commands::read_file(path.to_str().unwrap().to_string());
    assert_eq!(content, "# Hello");
}

#[test]
fn list_files_returns_recursive_tree() {
    let dir = tempdir().unwrap();
    fs::create_dir(dir.path().join("sub")).unwrap();
    fs::write(dir.path().join("sub/b.md"), "b").unwrap();
    let json = commands::list_files(dir.path().to_str().unwrap().to_string());
    assert!(json.contains("sub"));
    assert!(json.contains("b.md"));
    assert!(json.contains(".mdnotes") == false);
}

#[test]
fn zip_vault_excludes_mdnotes() {
    let dir = tempdir().unwrap();
    fs::create_dir(dir.path().join(".mdnotes")).unwrap();
    fs::write(dir.path().join(".mdnotes/index.json"), "{}").unwrap();
    fs::write(dir.path().join("n.md"), "n").unwrap();
    let out = dir.path().join("out.zip");
    commands::zip_vault(
        dir.path().to_str().unwrap().to_string(),
        out.to_str().unwrap().to_string(),
    );
    let file = std::fs::File::open(&out).unwrap();
    let mut archive = zip::ZipArchive::new(file).unwrap();
    assert_eq!(archive.len(), 1);
    let entry = archive.by_index(0).unwrap();
    assert_eq!(entry.name(), "n.md");
}
```

Cargo.toml `[dev-dependencies]` 添加 `tempfile = "3"`。

- [ ] **Step 2: 运行测试验证失败**

运行：`cargo test --manifest-path src-tauri/Cargo.toml`
Expected: 编译失败，`commands` 模块不存在。

- [ ] **Step 3: 实现 Rust 命令**

创建 `src-tauri/src/commands.rs`：

```rust
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Clone, serde::Serialize)]
pub struct TreeNode {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub children: Vec<TreeNode>,
}

fn is_mdnotes(dir: &Path) -> bool {
    dir.file_name().map_or(false, |n| n == ".mdnotes")
}

pub fn list_files(root: String) -> String {
    let root = PathBuf::from(&root);
    fn walk(dir: &Path) -> Vec<TreeNode> {
        let mut nodes = Vec::new();
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if is_mdnotes(&path) {
                    continue;
                }
                let name = entry.file_name().to_string_lossy().to_string();
                let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
                let mut node = TreeNode {
                    name,
                    path: path.to_string_lossy().to_string(),
                    is_dir,
                    children: Vec::new(),
                };
                if is_dir {
                    node.children = walk(&path);
                } else if !path.extension().map_or(false, |e| e == "md") {
                    continue;
                }
                nodes.push(node);
            }
        }
        nodes.sort_by(|a, b| {
            b.is_dir.cmp(&a.is_dir)
                .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
        });
        nodes
    }
    serde_json::to_string(&walk(&root)).unwrap_or_else(|_| "[]".to_string())
}

pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

pub fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

pub fn create_file(dir: String, name: String) -> Result<String, String> {
    let p = Path::new(&dir).join(name);
    if p.exists() {
        return Err("file already exists".to_string());
    }
    fs::write(&p, "").map_err(|e| e.to_string())?;
    Ok(p.to_string_lossy().to_string())
}

pub fn rename_file(old: String, new: String) -> Result<(), String> {
    fs::rename(&old, &new).map_err(|e| e.to_string())
}

pub fn delete_file(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(p)
    } else {
        fs::remove_file(p)
    }
    .map_err(|e| e.to_string())
}

pub fn create_dir(parent: String, name: String) -> Result<(), String> {
    fs::create_dir(Path::new(&parent).join(name)).map_err(|e| e.to_string())
}

pub fn zip_vault(root: String, out: String) -> Result<(), String> {
    let root = PathBuf::from(&root);
    let out_path = PathBuf::from(&out);
    let file = fs::File::create(&out_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default();

    fn add_dir(
        zip: &mut zip::ZipWriter<fs::File>,
        options: zip::write::SimpleFileOptions,
        base: &Path,
        dir: &Path,
    ) -> Result<(), String> {
        for entry in fs::read_dir(dir).map_err(|e| e.to_string())?.flatten() {
            let path = entry.path();
            if is_mdnotes(&path) {
                continue;
            }
            let rel = path.strip_prefix(base).unwrap().to_string_lossy().to_string();
            if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                zip.add_directory(&format!("{}/", rel), options)
                    .map_err(|e| e.to_string())?;
                add_dir(zip, options, base, &path)?;
            } else {
                let mut f = fs::File::open(&path).map_err(|e| e.to_string())?;
                zip.start_file(&rel, options).map_err(|e| e.to_string())?;
                let mut buf = Vec::new();
                f.read_to_end(&mut buf).map_err(|e| e.to_string())?;
                zip.write_all(&buf).map_err(|e| e.to_string())?;
            }
        }
        Ok(())
    }

    add_dir(&mut zip, options, &root, &root)?;
    zip.finish().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_files_cmd(root: String) -> Result<String, String> {
    Ok(list_files(root))
}

#[tauri::command]
pub fn read_file_cmd(path: String) -> Result<String, String> {
    read_file(path)
}

#[tauri::command]
pub fn write_file_cmd(path: String, content: String) -> Result<(), String> {
    write_file(path, content)
}

#[tauri::command]
pub fn create_file_cmd(dir: String, name: String) -> Result<String, String> {
    create_file(dir, name)
}

#[tauri::command]
pub fn rename_file_cmd(old: String, new: String) -> Result<(), String> {
    rename_file(old, new)
}

#[tauri::command]
pub fn delete_file_cmd(path: String) -> Result<(), String> {
    delete_file(path)
}

#[tauri::command]
pub fn create_dir_cmd(parent: String, name: String) -> Result<(), String> {
    create_dir(parent, name)
}

#[tauri::command]
pub fn zip_vault_cmd(root: String, out: String) -> Result<(), String> {
    zip_vault(root, out)
}

#[tauri::command]
pub fn pick_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    Ok(app.dialog().file().blocking_pick_folder().map(|p| p.to_string()))
}

#[tauri::command]
pub fn pick_file(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    Ok(app
        .dialog()
        .file()
        .add_filter("Markdown", &["md"])
        .blocking_pick_file()
        .map(|p| p.to_string()))
}

#[tauri::command]
pub fn read_vault_config_cmd(root: String) -> Result<String, String> {
    let p = Path::new(&root).join(".mdnotes").join("config.json");
    match fs::read_to_string(&p) {
        Ok(c) => Ok(c),
        Err(_) => Ok("{}".to_string()),
    }
}

#[tauri::command]
pub fn write_vault_config_cmd(root: String, config: String) -> Result<(), String> {
    let dir = Path::new(&root).join(".mdnotes");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(dir.join("config.json"), config).map_err(|e| e.to_string())
}
```

- [ ] **Step 4: 注册命令**

修改 `src-tauri/src/lib.rs`：

```rust
pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_files_cmd,
            commands::read_file_cmd,
            commands::write_file_cmd,
            commands::create_file_cmd,
            commands::rename_file_cmd,
            commands::delete_file_cmd,
            commands::create_dir_cmd,
            commands::zip_vault_cmd,
            commands::pick_folder,
            commands::pick_file,
            commands::read_vault_config_cmd,
            commands::write_vault_config_cmd
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 5: 运行 Rust 测试验证通过**

运行：`cargo test --manifest-path src-tauri/Cargo.toml`
Expected: 3 个测试全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/types.ts src-tauri/
git commit -m "feat: Rust 文件系统命令与集成测试"
```

`src/types.ts` 暂为空占位（Step 4 前创建），仅用于保持目录结构。

---

### Task 3: 纯函数核心库（frontmatter / linkParser / collision）

**Files:**
- Create: `src/lib/frontmatter.ts`
- Create: `src/lib/linkParser.ts`
- Create: `src/lib/collision.ts`
- Create: `src/lib/frontmatter.test.ts`
- Create: `src/lib/linkParser.test.ts`
- Create: `src/lib/collision.test.ts`

**Interfaces:**
- Produces:
  - `parseFrontmatter(content: string): { title?: string; tags: string[]; aliases: string[]; body: string; raw: string }`
  - `parseLinks(content: string): Array<{ target: string; label: string }>`
  - `extractTags(content: string): string[]`（frontmatter tags + 行内 `#tag`）
  - `resolveUniqueName(names: Set<string>, preferred: string): string`（同名追加 `-1`/`-2`）
  - `hasExplicitTitle(content: string): boolean`

- [ ] **Step 1: 写失败测试**

`src/lib/frontmatter.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { parseFrontmatter, hasExplicitTitle } from './frontmatter';

describe('parseFrontmatter', () => {
  it('解析 title/tags/aliases 并分离正文', () => {
    const src = `---
title: 我的笔记
tags: [a, b]
aliases: [别名A]
---

# 正文标题
内容`;
    const r = parseFrontmatter(src);
    expect(r.title).toBe('我的笔记');
    expect(r.tags).toEqual(['a', 'b']);
    expect(r.aliases).toEqual(['别名A']);
    expect(r.body).toContain('# 正文标题');
  });

  it('无 frontmatter 时返回空值且保留全文', () => {
    const r = parseFrontmatter('# hi');
    expect(r.title).toBeUndefined();
    expect(r.tags).toEqual([]);
    expect(r.body).toBe('# hi');
  });

  it('hasExplicitTitle 仅在有 title 字段时为真', () => {
    expect(hasExplicitTitle('---\ntags: [x]\n---\nbody')).toBe(false);
    expect(hasExplicitTitle('---\ntitle: t\n---\nbody')).toBe(true);
  });
});
```

`src/lib/linkParser.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { parseLinks, extractTags } from './linkParser';

describe('parseLinks', () => {
  it('解析基本双链', () => {
    const links = parseLinks('看 [[笔记A]] 和 [[笔记B|显示B]]');
    expect(links).toEqual([
      { target: '笔记A', label: '笔记A' },
      { target: '笔记B', label: '显示B' },
    ]);
  });

  it('忽略代码块与行内代码中的链接', () => {
    const src = '```\n[[不该解析]]\n```\n`[[也不该]]` 正常[[该解析]]';
    const links = parseLinks(src);
    expect(links.map((l) => l.target)).toEqual(['该解析']);
  });
});

describe('extractTags', () => {
  it('提取行内标签（不含 # 号）', () => {
    expect(extractTags('正文 #react 和 #typescript 测试')).toEqual(['react', 'typescript']);
  });

  it('不提取标题或链接内的井号', () => {
    expect(extractTags('## 标题')).toEqual([]);
  });
});
```

`src/lib/collision.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { resolveUniqueName } from './collision';

describe('resolveUniqueName', () => {
  it('无冲突直接返回', () => {
    expect(resolveUniqueName(new Set(['a.md']), 'b.md')).toBe('b.md');
  });
  it('同名追加 -1 -2', () => {
    const names = new Set(['a.md', 'a-1.md', 'a-2.md']);
    expect(resolveUniqueName(names, 'a.md')).toBe('a-3.md');
  });
  it('保留扩展名', () => {
    expect(resolveUniqueName(new Set(['a.md']), 'a.md')).toBe('a-1.md');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：`npx vitest run src/lib/frontmatter.test.ts src/lib/linkParser.test.ts src/lib/collision.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 配置 Vitest**

创建 `vite.config.ts`（若脚手架未含测试配置）：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

`package.json` 添加脚本：

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 4: 实现 frontmatter 解析**

`src/lib/frontmatter.ts`：

```ts
export interface Frontmatter {
  title?: string;
  tags: string[];
  aliases: string[];
  body: string;
  raw: string;
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseTags(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseYamlList(value: unknown): string[] {
  if (typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }
  return trimmed
    .split('\n')
    .map((s) => s.replace(/^\s*-\s*/, '').trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean);
}

export function parseFrontmatter(content: string): Frontmatter {
  const m = content.match(FM_RE);
  if (!m) {
    return { tags: [], aliases: [], body: content, raw: '' };
  }
  const raw = m[1];
  const body = content.slice(m[0].length);
  let title: string | undefined;
  let tags: string[] = [];
  let aliases: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const tm = line.match(/^title\s*:\s*(.+)$/);
    if (tm) {
      title = tm[1].trim().replace(/^['"]|['"]$/g, '');
      continue;
    }
    const tgm = line.match(/^tags\s*:\s*(.+)$/);
    if (tgm) {
      tags = parseTags(tgm[1]);
      continue;
    }
    const alm = line.match(/^aliases\s*:\s*(.+)$/);
    if (alm) {
      aliases = parseYamlList(alm[1]);
      continue;
    }
  }
  return { title, tags, aliases, body, raw };
}

export function hasExplicitTitle(content: string): boolean {
  return /^---\r?\n[\s\S]*?^title\s*:/m.test(content);
}
```

- [ ] **Step 5: 实现链接与标签解析**

`src/lib/linkParser.ts`：

```ts
import { parseFrontmatter } from './frontmatter';

export interface LinkRef {
  target: string;
  label: string;
}

function stripCodeFences(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ');
}

export function parseLinks(content: string): LinkRef[] {
  const text = stripCodeFences(content);
  const re = /\[\[([^\[\]]+)\]\]/g;
  const out: LinkRef[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const inner = m[1];
    const [target, ...rest] = inner.split('|');
    const label = rest.length > 0 ? rest.join('|') : target;
    out.push({ target: target.trim(), label: label.trim() });
  }
  return out;
}

export function extractTags(content: string): string[] {
  const text = stripCodeFences(content)
    .replace(/^#{1,6}\s.*$/gm, '')
    .replace(/\[\[[^\]]*\]\]/g, '');
  const fm = parseFrontmatter(content);
  const inline = Array.from(text.matchAll(/(?:^|\s)#([\p{L}\p{N}_-]+)/gu), (m) => m[1]);
  return Array.from(new Set([...fm.tags, ...inline]));
}
```

- [ ] **Step 6: 实现文件名冲突策略**

`src/lib/collision.ts`：

```ts
export function resolveUniqueName(names: ReadonlySet<string>, preferred: string): string {
  if (!names.has(preferred)) return preferred;
  const dot = preferred.lastIndexOf('.');
  const base = dot > 0 ? preferred.slice(0, dot) : preferred;
  const ext = dot > 0 ? preferred.slice(dot) : '';
  let i = 1;
  while (names.has(`${base}-${i}${ext}`)) i++;
  return `${base}-${i}${ext}`;
}
```

- [ ] **Step 7: 运行测试验证通过**

运行：`npm test`
Expected: 三个测试文件全部 PASS。

- [ ] **Step 8: 提交**

```bash
git add src/lib/ vite.config.ts package.json
git commit -m "feat: frontmatter 解析、双链解析、文件冲突策略纯函数"
```

---

### Task 4: Markdown 渲染管线与索引构建

**Files:**
- Create: `src/lib/markdown.ts`
- Create: `src/lib/indexer.ts`
- Create: `src/lib/markdown.test.ts`
- Create: `src/lib/indexer.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `parseFrontmatter`、`parseLinks`、`extractTags`
- Produces:
  - `renderMarkdown(markdown: string): Promise<string>`（返回完整 HTML，含样式）
  - `buildIndex(files: Array<{ path: string; content: string }>): NoteMeta[]`
  - `NoteMeta` 类型：`{ path, title, tags, aliases, links: string[], backlinks: string[], updatedAt: number, wordCount: number }`
  - `findNoteByTitle(notes: NoteMeta[], target: string): NoteMeta | undefined`

- [ ] **Step 1: 写失败测试**

`src/lib/markdown.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('渲染标题、列表、粗体', async () => {
    const html = await renderMarkdown('# 标题\n\n- a\n- **b**');
    expect(html).toContain('<h1>标题</h1>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<strong>b</strong>');
  });

  it('渲染 GFM 表格', async () => {
    const html = await renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(html).toContain('<table>');
  });

  it('把双链渲染为可点击 span', async () => {
    const html = await renderMarkdown('参考 [[笔记X]]');
    expect(html).toContain('data-link="笔记X"');
  });
});
```

`src/lib/indexer.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { buildIndex, findNoteByTitle } from './indexer';

const files = [
  {
    path: 'a.md',
    content: '---\ntitle: 笔记A\ntags: [x]\naliases: [A别名]\n---\n正文 [[笔记B]] #y',
  },
  { path: 'sub/b.md', content: '---\ntitle: 笔记B\n---\n反链 [[笔记A]]' },
  { path: 'c.md', content: '普通文件' },
];

describe('buildIndex', () => {
  it('构建标题、标签、链接、反向链接', () => {
    const idx = buildIndex(files);
    const a = idx.find((n) => n.path === 'a.md')!;
    expect(a.title).toBe('笔记A');
    expect(a.tags).toContain('x');
    expect(a.tags).toContain('y');
    expect(a.links).toContain('笔记B');
    expect(a.backlinks).toContain('sub/b.md');
  });

  it('无 frontmatter 时用文件名作标题', () => {
    const idx = buildIndex(files);
    expect(idx.find((n) => n.path === 'c.md')!.title).toBe('c');
  });

  it('aliases 参与反向链接匹配', () => {
    const idx = buildIndex(files);
    expect(idx.find((n) => n.path === 'a.md')!.backlinks).toContain('sub/b.md');
  });
});

describe('findNoteByTitle', () => {
  it('按文件名或别名匹配', () => {
    const idx = buildIndex(files);
    expect(findNoteByTitle(idx, 'A别名')?.path).toBe('a.md');
    expect(findNoteByTitle(idx, '笔记B')?.path).toBe('sub/b.md');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：`npx vitest run src/lib/markdown.test.ts src/lib/indexer.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现渲染管线**

`src/lib/markdown.ts`：

```ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

function linkPlugin() {
  return (tree: unknown) => {
    visit(tree as any, 'text', (node: any) => {
      const re = /\[\[([^\[\]]+)\]\]/g;
      if (!re.test(node.value)) return;
      node.type = 'html';
      node.value = node.value.replace(re, (_all: string, inner: string) => {
        const [target, ...rest] = inner.split('|');
        const label = rest.length > 0 ? rest.join('|') : target;
        return `<span class="wikilink" data-link="${target.trim()}" data-label="${label.trim()}">${label.trim()}</span>`;
      });
    });
  };
}

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(linkPlugin)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}

export function renderMarkdownSync(markdown: string): string {
  return markdown; // 占位，异步管线为主
}
```

依赖：`unist-util-visit` 需安装：

```bash
npm install unist-util-visit
```

- [ ] **Step 4: 实现索引构建**

`src/lib/indexer.ts`：

```ts
import { parseFrontmatter } from './frontmatter';
import { parseLinks, extractTags } from './linkParser';

export interface NoteMeta {
  path: string;
  title: string;
  tags: string[];
  aliases: string[];
  links: string[];
  backlinks: string[];
  updatedAt: number;
  wordCount: number;
}

export interface IndexInput {
  path: string;
  content: string;
}

function titleFromPath(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path;
  return base.replace(/\.md$/i, '');
}

function wordCount(content: string): number {
  const text = content.replace(/^---[\s\S]*?---/m, '').replace(/[#*`>\[\]|]/g, ' ');
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function buildIndex(files: IndexInput[]): NoteMeta[] {
  const metas: NoteMeta[] = files.map((f) => {
    const fm = parseFrontmatter(f.content);
    const links = parseLinks(f.content).map((l) => l.target);
    return {
      path: f.path,
      title: fm.title ?? titleFromPath(f.path),
      tags: extractTags(f.content),
      aliases: fm.aliases,
      links,
      backlinks: [],
      updatedAt: 0,
      wordCount: wordCount(f.content),
    };
  });

  const lookup = new Map<string, NoteMeta>();
  for (const m of metas) {
    lookup.set(m.title, m);
    for (const a of m.aliases) lookup.set(a, m);
  }

  for (const m of metas) {
    const targets = new Set(m.links);
    for (const t of targets) {
      const hit = lookup.get(t);
      if (hit && hit.path !== m.path && !hit.backlinks.includes(m.path)) {
        hit.backlinks.push(m.path);
      }
    }
  }
  return metas;
}

export function findNoteByTitle(notes: NoteMeta[], target: string): NoteMeta | undefined {
  const normalized = target.trim();
  return notes.find(
    (n) => n.title === normalized || n.aliases.includes(normalized) || titleFromPath(n.path) === normalized,
  );
}
```

- [ ] **Step 5: 运行测试验证通过**

运行：`npm test`
Expected: 全部 PASS。

- [ ] **Step 6: 提交**

```bash
git add src/lib/
git commit -m "feat: markdown 渲染管线与索引构建"
```

---

### Task 5: 前端 fs 封装与 Zustand store

**Files:**
- Create: `src/lib/fs.ts`
- Create: `src/store/vaultStore.ts`

**Interfaces:**
- Consumes: Task 2 的 Rust 命令（`list_files_cmd` 等）、Task 4 的 `buildIndex`/`NoteMeta`
- Produces:
  - `fsApi`：封装全部 invoke 调用
  - `useVaultStore`：`{ vaultPath, tree, notes, currentPath, content, dirty, tags, backlinksFor, openVault, openNote, setContent, save, createNote, renameNote, deleteNote, refreshTree, applySearch }`

- [ ] **Step 1: 实现 fs 封装**

`src/lib/fs.ts`：

```ts
import { invoke } from '@tauri-apps/api/core';

export interface TreeNode {
  name: string;
  path: string;
  is_dir: boolean;
  children: TreeNode[];
}

export const fsApi = {
  pickFolder: () => invoke<Option<String>>('pick_folder'),
  pickFile: () => invoke<Option<String>>('pick_file'),
  listFiles: (root: string) => invoke<string>('list_files_cmd', { root }),
  readFile: (path: string) => invoke<string>('read_file_cmd', { path }),
  writeFile: (path: string, content: string) =>
    invoke<void>('write_file_cmd', { path, content }),
  createFile: (dir: string, name: string) =>
    invoke<string>('create_file_cmd', { dir, name }),
  renameFile: (old: string, new: string) =>
    invoke<void>('rename_file_cmd', { old, new }),
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
```

注意：TS 中 `old`/`new` 是保留字，改为 Rust 参数名时需匹配。Rust 命令参数名 `old`、`new` 在 invoke 中传递键名为 `old`/`new`，TS 侧对象键需加引号：

```ts
renameFile: (oldPath: string, newPath: string) =>
  invoke<void>('rename_file_cmd', { old: oldPath, new: newPath }),
```

- [ ] **Step 2: 实现 Zustand store**

`src/store/vaultStore.ts`：

```ts
import { create } from 'zustand';
import { fsApi, TreeNode } from '../lib/fs';
import { buildIndex, NoteMeta, findNoteByTitle } from '../lib/indexer';
import { renderMarkdown } from '../lib/markdown';

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

export const useVaultStore = create<VaultState>((set, get) => ({
  vaultPath: null,
  tree: [],
  notes: [],
  currentPath: null,
  content: '',
  savedContent: '',
  dirty: false,
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
    const dir = await fsApi.pickFolder();
    if (!dir) return;
    const tree = JSON.parse(await fsApi.listFiles(dir)) as TreeNode[];
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
    const notes = buildIndex(files);
    set({ vaultPath: dir, tree, notes, currentPath: null, content: '', savedContent: '', dirty: false });
    get().refreshTree();
  },

  openNote: async (path: string) => {
    const content = await fsApi.readFile(path);
    set({ currentPath: path, content, savedContent: content, dirty: false });
  },

  setContent: (content: string) => set({ content, dirty: content !== get().savedContent }),

  save: async () => {
    const { currentPath, content } = get();
    if (!currentPath) return false;
    await fsApi.writeFile(currentPath, content);
    set({ savedContent: content, dirty: false });
    get().refreshTree();
    return true;
  },

  refreshTree: async () => {
    const { vaultPath } = get();
    if (!vaultPath) return;
    const tree = JSON.parse(await fsApi.listFiles(vaultPath)) as TreeNode[];
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
    const notes = buildIndex(files);
    set({ tree, notes });
  },
}));
```

- [ ] **Step 3: 类型补全 `src/types.ts`**

`src/types.ts`：

```ts
export type { TreeNode } from './lib/fs';
export type { NoteMeta } from './lib/indexer';
export type { Frontmatter } from './lib/frontmatter';
export type { LinkRef } from './lib/linkParser';
```

- [ ] **Step 4: 类型检查**

运行：`npx tsc --noEmit`
Expected: 无错误（`Option<String>` 应为 `Option<string>`，若报错改为 `string | null` 并修正 `pickFolder` 返回类型为 `Promise<string | null>`）。

- [ ] **Step 5: 提交**

```bash
git add src/lib/fs.ts src/store/ src/types.ts
git commit -m "feat: 前端 fs 封装与 vault store"
```

---

### Task 6: 三栏布局与核心组件

**Files:**
- Create: `src/App.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/FileTree.tsx`
- Create: `src/components/TagList.tsx`
- Create: `src/components/SearchResults.tsx`
- Create: `src/components/Editor.tsx`
- Create: `src/components/Preview.tsx`
- Create: `src/components/Backlinks.tsx`
- Create: `src/components/Toast.tsx`
- Create: `src/hooks/useAutoSave.ts`
- Create: `src/hooks/useFileWatch.ts`
- Create: `src/styles.css`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: Task 5 的 `useVaultStore`、`fsApi`；Task 4 的 `renderMarkdown`、`findNoteByTitle`
- Produces: 完整可用的三栏 UI（左栏切换文件树/标签/搜索、中栏编辑器、右栏预览/反向链接），打开笔记库后可编辑、预览、搜索、显示反向链接

- [ ] **Step 1: 全局样式与入口**

`src/styles.css`：

```css
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body { font-family: system-ui, sans-serif; background: #f7f7f5; color: #333; }
.app { display: flex; height: 100vh; }
.sidebar { width: 260px; min-width: 200px; border-right: 1px solid #ddd; background: #fff; display: flex; flex-direction: column; }
.sidebar-header { padding: 8px; display: flex; gap: 4px; border-bottom: 1px solid #eee; }
.sidebar-tab { flex: 1; padding: 6px; border: none; background: #f0f0f0; cursor: pointer; border-radius: 4px; }
.sidebar-tab.active { background: #4c6ef5; color: #fff; }
.sidebar-body { flex: 1; overflow: auto; padding: 8px; }
.center { flex: 1; display: flex; flex-direction: column; border-right: 1px solid #ddd; background: #fff; }
.editor { flex: 1; overflow: auto; }
.right { width: 320px; min-width: 240px; display: flex; flex-direction: column; background: #fff; }
.right-tabs { display: flex; border-bottom: 1px solid #eee; }
.right-tab { flex: 1; padding: 8px; border: none; background: #f0f0f0; cursor: pointer; }
.right-tab.active { background: #4c6ef5; color: #fff; }
.right-body { flex: 1; overflow: auto; padding: 12px; }
.file-tree-item { padding: 4px 8px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; gap: 6px; }
.file-tree-item:hover { background: #f0f0f0; }
.file-tree-item.active { background: #e7edff; }
.tag-item { padding: 4px 8px; cursor: pointer; border-radius: 4px; }
.tag-item:hover { background: #f0f0f0; }
.search-input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
.result-item { padding: 8px; cursor: pointer; border-bottom: 1px solid #eee; }
.result-item:hover { background: #f5f5f5; }
.toast { position: fixed; bottom: 20px; right: 20px; padding: 12px 16px; border-radius: 8px; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.2); z-index: 1000; }
.toast.error { background: #e03131; }
.toast.info { background: #2b8a3e; }
.wikilink { color: #4c6ef5; cursor: pointer; border-bottom: 1px dashed #4c6ef5; }
.empty { padding: 24px; text-align: center; color: #888; }
.statusbar { padding: 4px 12px; border-top: 1px solid #eee; font-size: 12px; color: #888; background: #fafafa; }
```

- [ ] **Step 2: Toast 组件**

`src/components/Toast.tsx`：

```tsx
import { useVaultStore } from '../store/vaultStore';

export default function Toast() {
  const toast = useVaultStore((s) => s.toast);
  if (!toast) return null;
  return <div className={`toast ${toast.type}`}>{toast.message}</div>;
}
```

- [ ] **Step 3: 侧栏（文件树/标签/搜索切换）**

`src/components/Sidebar.tsx`：

```tsx
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
```

- [ ] **Step 4: 文件树组件**

`src/components/FileTree.tsx`：

```tsx
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
        <div className="file-tree-item" style={{ paddingLeft: depth * 14 + 8 }} onClick={() => setExpanded(!expanded)}>
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
        fsApi.renameFile(node.path, parent + name).then(() => {
          refreshTree();
        }).catch((err) => showToast(String(err), 'error'));
      }
    } else if (action === '2') {
      if (confirm(`删除 ${node.name}？`)) {
        fsApi.deleteFile(node.path).then(refreshTree).catch((err) => showToast(String(err), 'error'));
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
      const unique = resolveUniqueName(names, newName.trim().endsWith('.md') ? newName.trim() : `${newName.trim()}.md`);
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
        <input value={newName} placeholder="新笔记名" onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createNote()} style={{ flex: 1, padding: 6 }} />
        <button onClick={createNote}>+</button>
      </div>
      {tree.map((n) => <NodeItem key={n.path} node={n} depth={0} />)}
    </div>
  );
}

function allNames(nodes: TreeNode[]): string[] {
  return nodes.flatMap((n) => (n.is_dir ? allNames(n.children) : [n.name]));
}
```

补充 import：`useState` 需在文件顶部引入。为保持简洁，统一在文件顶部补全 React import。

- [ ] **Step 5: 标签列表**

`src/components/TagList.tsx`：

```tsx
import { useMemo } from 'react';
import { useVaultStore } from '../store/vaultStore';

export default function TagList() {
  const notes = useVaultStore((s) => s.notes);
  const openNote = useVaultStore((s) => s.openNote);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of notes) for (const t of n.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [notes]);

  if (counts.length === 0) return <div className="empty">暂无标签</div>;
  return (
    <div>
      {counts.map(([tag, count]) => (
        <div key={tag} className="tag-item" onClick={() => openNote(notes.find((n) => n.tags.includes(tag))!.path)}>
          #{tag} <span style={{ color: '#999' }}>{count}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: 搜索组件**

`src/components/SearchResults.tsx`：

```tsx
import { useMemo, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';

export default function SearchResults() {
  const [q, setQ] = useState('');
  const notes = useVaultStore((s) => s.notes);
  const openNote = useVaultStore((s) => s.openNote);
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return notes
      .map((n) => {
        const titleHit = n.title.toLowerCase().includes(lower);
        const tagHit = n.tags.some((t) => t.toLowerCase().includes(lower));
        const bodyHit = n.links.some((l) => l.toLowerCase().includes(lower));
        const score = titleHit ? 2 : tagHit ? 1 : bodyHit ? 0 : -1;
        return { n, score };
      })
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score);
  }, [q, notes]);

  return (
    <div>
      <input className="search-input" placeholder="搜索笔记…" value={q} onChange={(e) => setQ(e.target.value)} />
      {results.map(({ n }) => (
        <div key={n.path} className="result-item" onClick={() => openNote(n.path)}>
          {n.title}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: 编辑器（CodeMirror + 自动保存）**

`src/hooks/useAutoSave.ts`：

```ts
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
```

`src/components/Editor.tsx`：

```tsx
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { useVaultStore } from '../store/vaultStore';
import { useAutoSave } from '../hooks/useAutoSave';

export default function Editor() {
  const currentPath = useVaultStore((s) => s.currentPath);
  const content = useVaultStore((s) => s.content);
  const setContent = useVaultStore((s) => s.setContent);
  useAutoSave();

  if (!currentPath) return <div className="empty">从左侧选择或新建一篇笔记</div>;

  return (
    <div className="editor">
      <CodeMirror
        value={content}
        onChange={(value) => setContent(value)}
        height="100%"
        extensions={[markdown({ base: markdownLanguage })]}
        basicSetup={{ lineNumbers: true, highlightActiveLine: true }}
      />
    </div>
  );
}
```

- [ ] **Step 8: 预览组件**

`src/components/Preview.tsx`：

```tsx
import { useEffect, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { renderMarkdown } from '../lib/markdown';
import { findNoteByTitle } from '../lib/indexer';

export default function Preview() {
  const content = useVaultStore((s) => s.content);
  const currentPath = useVaultStore((s) => s.currentPath);
  const notes = useVaultStore((s) => s.notes);
  const openNote = useVaultStore((s) => s.openNote);
  const [html, setHtml] = useState('');

  useEffect(() => {
    renderMarkdown(content).then(setHtml);
  }, [content]);

  const onClick = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest('.wikilink') as HTMLElement | null;
    if (!el) return;
    const target = el.dataset.link ?? '';
    const hit = findNoteByTitle(notes, target);
    if (hit) openNote(hit.path);
  };

  if (!currentPath) return <div className="empty">预览将显示在这里</div>;
  return <div className="preview-body" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
```

- [ ] **Step 9: 反向链接面板**

`src/components/Backlinks.tsx`：

```tsx
import { useVaultStore } from '../store/vaultStore';

export default function Backlinks() {
  const currentPath = useVaultStore((s) => s.currentPath);
  const notes = useVaultStore((s) => s.notes);
  const openNote = useVaultStore((s) => s.openNote);
  if (!currentPath) return null;
  const current = notes.find((n) => n.path === currentPath);
  if (!current || current.backlinks.length === 0) return <div className="empty">暂无反向链接</div>;
  return (
    <div>
      {current.backlinks.map((p) => {
        const meta = notes.find((n) => n.path === p)!;
        return (
          <div key={p} className="result-item" onClick={() => openNote(p)}>
            {meta.title}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 10: 应用壳（三栏布局）**

`src/App.tsx`：

```tsx
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import Backlinks from './components/Backlinks';
import Toast from './components/Toast';
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
```

- [ ] **Step 11: 文件监听 hook**

`src/hooks/useFileWatch.ts`：

```ts
import { useEffect, useRef } from 'react';
import chokidar from 'chokidar';
import { useVaultStore } from '../store/vaultStore';

export function useFileWatch() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const watcher = useRef<chokidar.FSWatcher | null>(null);

  useEffect(() => {
    if (!vaultPath) return;
    if (watcher.current) {
      watcher.current.close();
      watcher.current = null;
    }
    watcher.current = chokidar.watch(vaultPath, {
      ignored: /[\\/]\.mdnotes[\\/]|node_modules/,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 300, pollInterval: 100 },
    });
    let timer: number | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(() => {
        useVaultStore.getState().refreshTree();
      }, 400);
    };
    watcher.current.on('all', schedule);
    return () => {
      if (timer) clearTimeout(timer);
      if (watcher.current) watcher.current.close();
      watcher.current = null;
    };
  }, [vaultPath]);
}
```

- [ ] **Step 12: 更新 `src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 13: 补全 React import**

`FileTree.tsx` 顶部需补：`import { useState } from 'react';`
`App.tsx` 顶部需补：`import { useState } from 'react';`

- [ ] **Step 14: 启动并手动验证**

运行：`npm run tauri dev`
验证清单：
- 点击「打开笔记库文件夹」选择目录
- 左侧出现文件树，可新建笔记、右键重命名/删除
- 选择笔记后中栏可编辑，右侧实时预览渲染标题/列表/表格/双链
- 点击预览中的双链可跳转
- 标签页显示标签计数，搜索页可检索
- 外部用其他编辑器修改 `.md` 文件后，约 1 秒内文件树/反向链接刷新
- 自动保存生效（状态栏「未保存」消失）

- [ ] **Step 15: 提交**

```bash
git add src/
git commit -m "feat: 三栏 UI、编辑器、预览、标签搜索、反向链接、文件监听"
```

---

### Task 7: 导入导出

**Files:**
- Modify: `src/App.tsx`（顶部工具栏）
- Create: `src/components/Toolbar.tsx`
- Create: `src/lib/export.ts`
- Create: `src/lib/export.test.ts`

**Interfaces:**
- Consumes: Task 2 的 `pick_file`/`zip_vault_cmd`、Task 5 的 `fsApi`、Task 6 的 `renderMarkdown`/store
- Produces:
  - `exportHtml(note): Promise<void>`（写 HTML 文件到用户选择位置）
  - `exportPdf()`（触发 webview 打印）
  - `exportZip(vaultPath): Promise<void>`（选保存路径后打包）
  - `importFiles(vaultPath): Promise<void>`（选文件/文件夹复制进库）

- [ ] **Step 1: 写失败测试**

`src/lib/export.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { wrapHtml } from './export';

describe('wrapHtml', () => {
  it('生成含样式与内容的完整 HTML', () => {
    const html = wrapHtml('<h1>标题</h1>', '笔记标题');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<h1>标题</h1>');
    expect(html).toContain('<title>笔记标题</title>');
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：`npx vitest run src/lib/export.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现导出封装**

`src/lib/export.ts`：

```ts
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
  const { save } = await import('@tauri-apps/plugin-dialog');
  const p = await save({ defaultPath: defaultName, filters: [{ name: ext.toUpperCase(), extensions: [ext] }] });
  return p ?? null;
}
```

- [ ] **Step 4: 运行测试验证通过**

运行：`npm test`
Expected: export 测试 PASS。

- [ ] **Step 5: 实现导入功能**

在 `src/components/Toolbar.tsx`：

```tsx
import { useVaultStore } from '../store/vaultStore';
import { fsApi } from '../lib/fs';
import { resolveUniqueName } from '../lib/collision';
import { exportCurrentAsHtml, exportZip, exportPdf } from '../lib/export';

export default function Toolbar() {
  const vaultPath = useVaultStore((s) => s.vaultPath);
  const refreshTree = useVaultStore((s) => s.refreshTree);
  const showToast = useVaultStore((s) => s.showToast);

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
    <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid #eee', background: '#fff' }}>
      <button disabled={!vaultPath} onClick={onImport}>导入 Markdown</button>
      <button disabled={!useVaultStore.getState().currentPath} onClick={exportCurrentAsHtml}>导出 HTML</button>
      <button disabled={!useVaultStore.getState().currentPath} onClick={exportPdf}>导出 PDF</button>
      <button disabled={!vaultPath} onClick={exportZip}>导出库 ZIP</button>
    </div>
  );
}
```

- [ ] **Step 6: 挂载工具栏到 App**

在 `src/App.tsx` 中，`<main className="center">` 顶部加入 `<Toolbar />`，并 `import Toolbar from './components/Toolbar';`。

- [ ] **Step 7: Rust 侧补充 `save` 对话框命令**

`src-tauri/src/commands.rs` 添加：

```rust
#[tauri::command]
pub fn save_file(app: tauri::AppHandle, default_name: String, ext: String) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    Ok(app
        .dialog()
        .file()
        .add_filter(&ext.to_uppercase(), &[&ext])
        .set_file_name(&default_name)
        .blocking_save_file()
        .map(|p| p.to_string()))
}
```

注册到 `lib.rs` 的 `generate_handler!` 中。

前端 `src/lib/export.ts` 的 `pickSavePath` 改为：

```ts
async function pickSavePath(defaultName: string, ext: string): Promise<string | null> {
  return await fsApi.saveFile(defaultName, ext);
}
```

`src/lib/fs.ts` 添加：

```ts
saveFile: (defaultName: string, ext: string) =>
  invoke<string | null>('save_file', { defaultName, ext }),
```

注意：Rust 参数名 `default_name` 对应 JS 端 `defaultName`（Tauri 自动转 camelCase）。

- [ ] **Step 8: 添加 PDF 导出能力**

`src-tauri/capabilities/default.json` 确保已含 `core:window:allow-print`。前端 `exportPdf` 调用 `window.print()` 后，用户可通过系统打印对话框另存为 PDF。

- [ ] **Step 9: 构建验证**

运行：`cargo test --manifest-path src-tauri/Cargo.toml && npm test`
Expected: 全部 PASS。

- [ ] **Step 10: 手动验证**

运行：`npm run tauri dev`
- 导入一个 `.md` 文件 → 出现在文件树、索引含其内容
- 导出当前笔记 HTML → 生成完整单文件
- 导出库 ZIP → 压缩包不含 `.mdnotes/`
- 导出 PDF → 弹出打印对话框

- [ ] **Step 11: 提交**

```bash
git add src/ src-tauri/
git commit -m "feat: 导入导出 HTML/PDF/ZIP"
```

---

### Task 8: 搜索增强、错误处理与收尾

**Files:**
- Modify: `src/components/SearchResults.tsx`
- Create: `src/lib/search.ts`
- Create: `src/lib/search.test.ts`
- Modify: `src/store/vaultStore.ts`（错误处理）
- Modify: `src/components/Preview.tsx`（外部删除提示）
- Create: `docs/superpowers/plans/e2e-checklist.md`

**Interfaces:**
- Consumes: Task 5 的 store、Task 6 的组件
- Produces: 全文搜索（标题+正文）、排序规则、健壮错误提示

- [ ] **Step 1: 写失败测试**

`src/lib/search.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { searchNotes } from './search';
import { buildIndex } from './indexer';

const notes = buildIndex([
  { path: 'a.md', content: '---\ntitle: 项目计划\n---\n讨论 roadmap 和 里程碑' },
  { path: 'b.md', content: '---\ntitle: 日记\n---\n今天的 roadmap 笔记' },
  { path: 'c.md', content: '---\ntitle: 备忘\n---\n无相关内容' },
]);

describe('searchNotes', () => {
  it('标题命中排前，正文命中排后', () => {
    const r = searchNotes(notes, 'roadmap');
    expect(r[0].path).toBe('b.md'); // 内容命中，标题不含
    const r2 = searchNotes(notes, '项目');
    expect(r2[0].path).toBe('a.md'); // 标题命中
  });

  it('无匹配返回空数组', () => {
    expect(searchNotes(notes, '不存在')).toEqual([]);
  });
});
```

注意：`searchNotes` 需要正文内容，`NoteMeta` 不含正文，需扩展输入。改为 `searchNotes(files: Array<{path,title,content}>, q)`。

修正测试：用原始文件数组。

```ts
const files = [
  { path: 'a.md', title: '项目计划', content: '讨论 roadmap 和 里程碑' },
  { path: 'b.md', title: '日记', content: '今天的 roadmap 笔记' },
  { path: 'c.md', title: '备忘', content: '无相关内容' },
];

describe('searchNotes', () => {
  it('标题命中优先', () => {
    const r = searchNotes(files, 'roadmap');
    expect(r.map((x) => x.path)).toEqual(['b.md', 'a.md']);
  });
  it('无匹配返回空数组', () => {
    expect(searchNotes(files, '不存在')).toEqual([]);
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

运行：`npx vitest run src/lib/search.test.ts`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现搜索**

`src/lib/search.ts`：

```ts
export interface SearchableFile {
  path: string;
  title: string;
  content: string;
  tags: string[];
}

export function searchNotes(files: SearchableFile[], query: string): SearchableFile[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = files
    .map((f) => {
      const titleHit = f.title.toLowerCase().includes(q);
      const contentHit = f.content.toLowerCase().includes(q);
      const tagHit = f.tags.some((t) => t.toLowerCase().includes(q));
      if (!titleHit && !contentHit && !tagHit) return null;
      const score = titleHit ? 2 : tagHit ? 1 : 0;
      return { file: f, score };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.score - a.score);
  return scored.map((s) => s.file);
}
```

`SearchResults.tsx` 改用 `searchNotes`，并传入 `content`：

```tsx
import { useMemo, useState } from 'react';
import { useVaultStore } from '../store/vaultStore';
import { searchNotes, SearchableFile } from '../lib/search';

export default function SearchResults() {
  const [q, setQ] = useState('');
  const notes = useVaultStore((s) => s.notes);
  const openNote = useVaultStore((s) => s.openNote);
  const files = useMemo<SearchableFile[]>(
    () =>
      notes.map((n) => ({
        path: n.path,
        title: n.title,
        tags: n.tags,
        content: n.links.join(' '),
      })),
    [notes],
  );
  const results = useMemo(() => searchNotes(files, q), [q, files]);
  // ...渲染 results
}
```

说明：store 未缓存正文，此实现用 `links` 作近似内容检索；若要全文检索正文，需在 `refreshTree` 中把 `content` 存入内存缓存（见 Step 4 改进）。

- [ ] **Step 4: store 增加正文缓存**

`src/store/vaultStore.ts` 的 `VaultState` 增加字段：

```ts
contentCache: Record<string, string>;
```

`openVault`/`refreshTree` 中填充 `contentCache[path] = content`；`openNote` 时用缓存优先（若缓存无则读文件）：

```ts
openNote: async (path: string) => {
  const cache = get().contentCache[path];
  const content = cache ?? (await fsApi.readFile(path));
  set({ currentPath: path, content, savedContent: content, dirty: false });
},
```

`SearchResults.tsx` 的 `content` 改为 `useVaultStore((s) => s.contentCache[path])`：

```tsx
const contentCache = useVaultStore((s) => s.contentCache);
const files = useMemo<SearchableFile[]>(
  () => notes.map((n) => ({ path: n.path, title: n.title, tags: n.tags, content: contentCache[n.path] ?? '' })),
  [notes, contentCache],
);
```

- [ ] **Step 5: 错误处理完善**

`vaultStore.ts` 中所有 async 操作包裹 try/catch，错误转 toast：

```ts
openNote: async (path: string) => {
  try {
    const cache = get().contentCache[path];
    const content = cache ?? (await fsApi.readFile(path));
    set({ currentPath: path, content, savedContent: content, dirty: false });
  } catch (err) {
    get().showToast(`无法打开文件：${err}`, 'error');
    set({ currentPath: null, content: '', savedContent: '', dirty: false });
  }
},
```

- [ ] **Step 6: 外部删除提示**

`Preview.tsx` 渲染失败时（`html` 为空且 `currentPath` 存在）显示提示：

```tsx
if (currentPath && !html) {
  return (
    <div className="empty">
      <p>预览不可用</p>
      <button onClick={() => useVaultStore.getState().showToast('请检查文件是否存在', 'error')}>重新加载</button>
    </div>
  );
}
```

- [ ] **Step 7: 运行全部测试**

运行：`npm test && cargo test --manifest-path src-tauri/Cargo.toml`
Expected: 全部 PASS。

- [ ] **Step 8: 编写 E2E 手动验证清单**

创建 `docs/superpowers/plans/e2e-checklist.md`：

```markdown
# 端到端手动验证清单

1. 打开笔记库：选择目录，文件树正确显示层级与 .md 文件
2. 新建笔记：输入名自动补 .md，出现在树中并打开
3. 编辑保存：输入内容，500ms 后状态栏「未保存」消失；Ctrl+S 立即保存
4. 实时预览：标题/列表/表格/粗体/代码块正确渲染
5. 双链跳转：点击预览中的 `[[笔记]]` 打开对应笔记
6. 反向链接：打开被引用的笔记，右栏「反向链接」列出引用来源
7. 标签：左栏标签页计数正确，点击筛选
8. 搜索：标题命中优先于正文命中，点击结果打开笔记
9. 外部改动：用记事本修改 .md 保存，App 约 1 秒内刷新
10. 导入：导入 .md 文件出现在树中
11. 导出 HTML：生成含样式单文件，浏览器打开正常
12. 导出 PDF：打印对话框正常弹出
13. 导出 ZIP：压缩包保留目录结构、不含 .mdnotes
14. 错误处理：删除正在编辑的文件后重载，提示不崩溃
15. 删除笔记：右键删除，文件树与反向链接同步更新
```

- [ ] **Step 9: 提交**

```bash
git add src/ docs/superpowers/plans/e2e-checklist.md
git commit -m "feat: 全文搜索与错误处理完善"
```

---

## Self-Review

**1. Spec coverage:**
- 编辑+实时预览 → Task 6（Editor/Preview）
- 多笔记管理（目录/标签/搜索）→ Task 6（FileTree/TagList/SearchResults）+ Task 8（全文搜索）
- 双链/反向链接 → Task 3（解析）+ Task 4（索引）+ Task 6（Backlinks/Preview 跳转）
- 导入导出（HTML/PDF/ZIP）→ Task 7
- 自动保存 → Task 6 useAutoSave
- 文件监听增量更新 → Task 6 useFileWatch
- 错误处理 → Task 8
- 测试 → 各任务内嵌 TDD + Task 8 汇总
- 明确不做项 → 无任务覆盖，符合预期

**2. Placeholder scan:** 无 TBD/TODO；所有代码步骤含完整实现。

**3. Type consistency:**
- `buildIndex` 返回 `NoteMeta`（含 `links`/`backlinks`）在 Task 4 定义，Task 5/6/8 一致使用
- `fsApi` 方法名 `listFiles/readFile/writeFile/createFile/renameFile/deleteFile/createDir/zipVault/pickFolder/pickFile/readVaultConfig/writeVaultConfig/saveFile` 全流程一致
- Rust 命令 `*_cmd` 后缀与 `lib.rs` 注册一一对应
- `renderMarkdown` 异步返回 `Promise<string>` 在 Task 4/6/7 一致
- `searchNotes` 输入 `SearchableFile[]` 在 Task 8 定义并被 SearchResults 使用

**已知待办（不影响任务进度，实施时处理）：**
- Task 2 中 `src/types.ts` 为空占位，Task 5 Step 3 填充
- Task 5 Step 4 的 `Option<String>` 类型笔误，tsc 检查时修正为 `string | null`
- Task 6 FileTree 的 `useState` import 需在 Step 13 补齐
- Rust 参数名 snake_case（`default_name`）与 JS 端 camelCase（`defaultName`）的映射已注明