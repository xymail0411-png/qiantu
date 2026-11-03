## 概述

本仓库是一个 Vite + React + TypeScript + TailwindCSS 的前端记账应用（qiantu），没有运行时配置文件（无 .env、application.properties、YAML/TOML 等）。所有“配置”集中在构建/开发工具链中，通过各工具的声明式配置文件进行组织。

## 关键文件

- `package.json` — 项目元信息、脚本、依赖（含 devDependencies）
- `vite.config.ts` — Vite 构建配置
- `tailwind.config.js` — TailwindCSS 主题与自定义色板
- `postcss.config.js` — PostCSS 插件链（Tailwind + Autoprefixer）
- `tsconfig.json` — TypeScript 编译选项
- `.gitignore` — Git 忽略规则

## 架构与约定

### 构建与开发脚本（`package.json` scripts）

- `dev`: 直接运行 `vite` 启动开发服务器
- `build`: 先执行 `tsc -b`（TypeScript 构建），再执行 `vite build` 打包
- `preview`: `vite preview` 预览生产产物

类型系统由 `tsc` 单独负责（`noEmit: true`，仅做类型检查），Vite 负责打包；`@vitejs/plugin-react` 提供 JSX/TSX 支持。模块系统采用 ESM（`"type": "module"`），TypeScript 目标为 ES2020，解析器使用 bundler 模式。

### Vite 配置（`vite.config.ts`）

极简配置：仅启用 `@vitejs/plugin-react` 插件，其余走默认值。未显式配置 `resolve.alias`、`define` 等，意味着不存在按环境注入的运行时常量或路径别名。

### TailwindCSS 主题（`tailwind.config.js`）

通过 `theme.extend.colors` 扩展了业务色板：`bg`、`card`、`primary`、`expense`、`income`、`text`、`sub`、`border`。扫描范围限定在 `./index.html` 和 `./src/**/*.{js,ts,jsx,tsx}`，确保仅对源码进行 class 扫描。

### PostCSS（`postcss.config.js`）

插件顺序固定为 `tailwindcss` → `autoprefixer`，由 Vite 在构建时自动加载。

### TypeScript（`tsconfig.json`）

严格模式开启：`strict`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`、`noUncheckedSideEffectImports`、`isolatedModules`、`moduleDetection: force`。JSX 使用 `react-jsx`（React 17+ 新 JSX 转换）。`include` 仅包含 `src` 目录。

### 运行时配置策略

项目中未发现任何运行时配置加载机制（无 `.env` 文件、无环境变量读取、无 feature flag 系统、无远程配置中心）。应用状态通过 Zustand（`src/store/index.ts`）管理，数据通过 Dexie（IndexedDB，`src/db/index.ts`）持久化，静态数据（分类、徽章、奖品等）以 TS 源文件形式内嵌（`src/data/*.ts`）。这意味着应用的“配置”全部是编译期常量，而非可外部化的运行时参数。

## 约定与约束

- 模块格式统一为 ESM（`package.json` 中 `"type": "module"`）。
- 所有源代码位于 `src/` 根下（`tsconfig.json` 的 `include` 限制生效）。
- 样式类名必须来自 Tailwind 预设或 `tailwind.config.js` 中定义的自定义色，否则会被 PurgeCSS（通过 content 扫描）移除。
- TypeScript 编译选项强制严格模式，未使用的局部变量和参数会在编译时报错。
- 构建流程要求先 `tsc -b` 再做 `vite build`，因此 TypeScript 类型错误会阻断构建。
- 未定义任何环境变量前缀（如 `VITE_`），说明不向浏览器暴露运行时配置。

## 结论

该仓库的“配置系统”本质上是**纯构建期配置**，围绕 Vite + TypeScript + TailwindCSS 三大工具展开，没有任何运行时配置加载、环境变量注入或特性开关机制。新增配置项应遵循现有文件的声明式约定（TS/JS 导出 default 对象）。