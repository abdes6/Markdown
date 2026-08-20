# AGENTS.md

## 项目概述

本地 Markdown 笔记桌面应用。笔记以纯 `.md` 文件存储于用户选择的文件夹（笔记库 Vault），提供编辑、实时预览、多笔记管理（目录/标签/搜索）、双链与反向链接、导入导出功能。

## 技术栈

- **Tauri 2 + React + TypeScript + Vite**
- 编辑器：CodeMirror 6
- Markdown 渲染：unified / remark / rehype
- 状态管理：Zustand
- 文件监听：chokidar
- 测试：Vitest + Testing Library（前端）、cargo test（Rust）

## 常用命令

```bash
npm run tauri dev      # 开发模式
npm run build          # 前端构建
npm run tauri build    # 打包桌面应用
npm test               # 前端单元/组件测试
cargo test             # Rust 集成测试（在 src-tauri/ 下）
```

## 架构约定

- **前端（React）承载绝大部分业务逻辑**：UI、编辑、预览渲染、索引构建、搜索、双链解析、文件监听、HTML 导出
- **Rust 后端为薄层**：仅提供文件系统命令（选择目录、列出/读写/创建/重命名/删除文件）、PDF 导出、ZIP 打包
- 笔记库内隐藏目录 `.mdnotes/` 存放 `config.json`（配置）与 `index.json`（索引缓存），运行时生成，不提交到 git
- 双链语法：`[[笔记名]]`、`[[笔记名|显示文字]]`（按文件名与 aliases 匹配）
- 标签语法：行内 `#tag` 或 YAML frontmatter `tags`；frontmatter 支持 `title` / `tags` / `aliases`

## 目录结构

```
├── src/                  # React 前端
├── src-tauri/            # Rust 后端
├── docs/superpowers/     # 设计文档与规格
└── .mdnotes/             # 运行时生成，不提交
```

## 代码规范

- 默认中文沟通；代码、命令、变量名、文件路径保持英文
- 不添加注释，除非明确要求
- 遵循现有代码模式，复用已有工具与库
- 保持模块单一职责，通过清晰接口通信

## Git 规范

- 不自动 `git commit` 或 `git push`，除非明确要求
- 提交前先展示将要提交的变更摘要
- commit message 用简洁中文总结变更内容
- 一次提交只包含一个逻辑变更，不混入无关改动

## 红线操作

以下操作即使在 auto-accept 模式下也必须先问：

- 删除文件、目录或 git 历史
- 修改 `.env`、密钥、token、证书、CI/CD 配置
- `git push`、`git rebase`、`git reset --hard`、强制推送
- 公开发布（npm publish、生产部署等）