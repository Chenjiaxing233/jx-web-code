# React Monaco Code Editor

基于 React + Monaco Editor 构建的轻量级 Web 代码编辑器，支持打开本地文件夹、新建文件/文件夹、多标签编辑与自动保存。

## 功能特性

- **打开本地文件夹** — 通过浏览器 File System Access API 直接读写硬盘上的真实文件
- **文件树浏览** — 侧边栏以树形结构展示文件夹内容，支持展开/折叠
- **新建文件与文件夹** — 在侧边栏顶部或任意文件夹上点击按钮，输入名称即可在硬盘中创建
- **多标签编辑** — 点击文件树中的文件打开为标签页，支持同时打开多个文件
- **自动保存** — 编辑内容在停止输入 500ms 后自动写入硬盘
- **语法高亮** — 支持 TypeScript、JavaScript、JSX/TSX、Vue、Go、Java、Python、JSON、HTML、CSS、Markdown、Rust、C/C++ 等语言
- **主题切换** — 支持亮色 (Light) 与暗色 (Dark) 主题

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18 |
| 编辑器 | Monaco Editor (VS Code 同款内核) |
| 构建工具 | Vite 6 |
| 语言 | TypeScript 5.6 |
| 状态管理 | React Context + useReducer |
| 文件系统 | File System Access API (纯前端) |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm / npm / yarn
- **Chrome 或 Edge 浏览器**（File System Access API 仅 Chromium 内核浏览器支持）

### 安装与启动

```bash
# 克隆项目
git clone <repo-url>
cd react-monaco-cc

# 安装依赖
pnpm install   # 或 npm install

# 启动开发服务器
pnpm dev       # 或 npm run dev
```

浏览器打开 `http://localhost:5173` 即可使用。

### 构建生产版本

```bash
pnpm build     # 或 npm run build
pnpm preview   # 本地预览构建产物
```

## 使用说明

### 1. 打开文件夹

启动后侧边栏会显示 **Open Folder** 按钮，点击后浏览器会弹出目录选择窗口，选择你要编辑的项目文件夹。顶部导航栏也有 **Open Folder** 按钮可用。

> 首次打开时浏览器会请求读写权限，点击「允许」即可。

### 2. 浏览文件树

打开文件夹后，侧边栏会以树形结构展示该目录下的所有文件和子文件夹：

- 点击 **文件夹** 可展开/折叠
- 点击 **文件** 会在编辑器中打开该文件
- 隐藏文件（以 `.` 开头）会自动过滤

### 3. 新建文件 / 文件夹

有两种方式：

- **在根目录创建** — 点击侧边栏标题栏右侧的 `+`（新建文件）或 `⊞`（新建文件夹）按钮
- **在指定文件夹内创建** — 鼠标悬停在某个文件夹上，右侧会出现 `+` 和 `⊞` 按钮

点击按钮后会出现内联输入框，输入文件名并按 **Enter** 确认创建，按 **Escape** 取消。

### 4. 编辑与自动保存

在编辑器中修改文件内容后，停止输入 **500 毫秒**后会自动保存到硬盘，无需手动保存。

### 5. 管理标签页

- 点击标签页可切换文件
- 悬停标签页后点击 **×** 可关闭该文件（不会删除硬盘文件）

### 6. 切换主题

点击顶部导航栏右侧的 **☀ Light / ☾ Dark** 按钮切换亮色/暗色主题。

## 项目结构

```
react-monaco-cc/
├── src/
│   ├── main.tsx                  # 应用入口
│   ├── App.tsx                   # 根组件（布局）
│   ├── App.css                   # 全局样式
│   ├── types/
│   │   ├── index.ts              # TypeScript 类型定义
│   │   └── fs-access.d.ts        # File System Access API 类型声明
│   ├── stores/
│   │   └── editorStore.tsx       # 状态管理（Context + Reducer）
│   ├── services/
│   │   └── fs.ts                 # 文件系统操作服务
│   └── components/
│       ├── Header.tsx            # 顶部导航栏
│       ├── Sidebar.tsx           # 侧边栏文件树
│       ├── FileTabs.tsx          # 文件标签栏
│       └── Editor.tsx            # Monaco 编辑器（含语言配置）
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|---------|
| Chrome 86+ | 完全支持 |
| Edge 86+ | 完全支持 |
| Firefox | 不支持（无 File System Access API） |
| Safari | 不支持（无 File System Access API） |

## License

MIT
