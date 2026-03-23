# React Monaco Code Editor

> 基于 React + Monaco Editor 的轻量级 Web 代码编辑器

[![Tests](https://img.shields.io/badge/tests-15%2B%20automated-brightgreen)](./tests)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)

## ✨ 功能特性

### 核心功能
- 📁 **文件系统访问** - 使用 File System Access API 打开本地文件夹
- 🌳 **文件树浏览** - 展开/折叠文件夹，创建/删除文件
- 📝 **多标签编辑** - 同时打开和编辑多个文件
- 💾 **自动保存** - 停止输入 500ms 后自动保存到硬盘
- 🎨 **语法高亮** - 支持 20+ 种编程语言
- 🌓 **主题切换** - 亮色/暗色主题

### 最新功能 (v1.1)
- ✅ **文件删除功能** - 支持删除文件和文件夹
- ✅ **外部修改检测** - 窗口获得焦点时自动检测文件修改
- ✅ **手动刷新** - 标签页上的刷新按钮（↻）
- ✅ **Toast 通知** - 友好的操作反馈
- ✅ **错误处理** - 完整的错误提示系统
- ✅ **CSS 模块化** - 代码结构更清晰

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

### 4. 删除文件/文件夹

- 悬停在文件/文件夹上
- 点击红色的 **✕** 按钮
- 确认删除操作
- 删除成功会显示 Toast 提示

### 5. 编辑与自动保存

在编辑器中修改文件内容后，停止输入 **500 毫秒**后会自动保存到硬盘，无需手动保存。

### 6. 外部修改检测

**自动检测**：
- 在外部编辑器（如 VS Code）中修改文件
- 切换回浏览器窗口
- 自动检测修改并提示重新加载

**手动刷新**：
- 悬停在文件标签页上
- 点击刷新按钮（↻）
- 文件立即重新加载

### 7. 管理标签页

- 点击标签页可切换文件
- 悬停标签页后点击 **×** 可关闭该文件（不会删除硬盘文件）

### 8. 切换主题

点击顶部导航栏右侧的 **☀ Light / ☾ Dark** 按钮切换亮色/暗色主题。

## 🧪 测试

### 运行测试

```bash
# 安装 Playwright 浏览器
npx playwright install chromium

# 运行所有测试
pnpm test

# UI 模式（推荐）
pnpm run test:ui

# 查看测试报告
pnpm run test:report
```

### 测试覆盖

- ✅ **15+ 自动化测试用例**
- ✅ **100% 核心功能覆盖**
- ✅ **Mock File System API** - 无需手动授权
- ✅ **Bug 修复验证** - 自动验证已修复的 bug

详细测试文档：[tests/README.md](./tests/README.md)

## 项目结构

```
react-monaco-cc/
├── src/
│   ├── main.tsx                  # 应用入口
│   ├── App.tsx                   # 根组件（布局）
│   ├── types/
│   │   ├── index.ts              # TypeScript 类型定义
│   │   └── fs-access.d.ts        # File System Access API 类型声明
│   ├── stores/
│   │   └── editorStore.tsx       # 状态管理（Context + Reducer）
│   ├── services/
│   │   └── fs.ts                 # 文件系统操作服务
│   ├── styles/                   # CSS 模块
│   │   ├── common.css            # 全局样式
│   │   ├── header.css            # 头部样式
│   │   ├── sidebar.css           # 侧边栏样式
│   │   ├── tabs.css              # 标签页样式
│   │   └── editor.css            # 编辑器样式
│   └── components/
│       ├── Header.tsx            # 顶部导航栏
│       ├── Sidebar.tsx           # 侧边栏文件树
│       ├── FileTabs.tsx          # 文件标签栏
│       ├── Editor.tsx            # Monaco 编辑器
│       └── Toast.tsx             # Toast 通知组件
├── tests/                        # Playwright 测试
│   ├── automated-*.spec.ts       # 自动化测试
│   ├── mocks/                    # Mock API
│   └── README.md                 # 测试文档
├── package.json
├── tsconfig.json
├── vite.config.ts
├── playwright.config.ts
└── index.html
```

## 🛠️ 代码质量

### Lint 和格式化

```bash
# 检查代码规范
pnpm run lint

# 自动修复
pnpm run lint:fix

# 格式化代码
pnpm run format
```

### Git Hooks

项目配置了 pre-commit hook，提交前自动运行：
- ESLint 检查和修复
- Prettier 格式化

## 🗺️ 开发路线图

查看 [plan.md](./plan.md) 了解详细的改进计划。

### 下一阶段
- [ ] 添加单元测试
- [ ] 实现文件搜索功能
- [ ] 优化大文件夹加载性能
- [ ] 添加键盘快捷键

## 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|---------|
| Chrome 86+ | ✅ 完全支持 |
| Edge 86+ | ✅ 完全支持 |
| Firefox | ❌ 不支持（无 File System Access API） |
| Safari | ❌ 不支持（无 File System Access API） |

## 🙏 致谢

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 强大的代码编辑器
- [React](https://reactjs.org/) - UI 框架
- [Vite](https://vitejs.dev/) - 快速的构建工具
- [Playwright](https://playwright.dev/) - 可靠的端到端测试

---

**版本**: v1.1.0
**最后更新**: 2026-03-18
**作者**: jake

## License

MIT
