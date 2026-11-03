## 1. 构建工具与方案

项目采用 **Vite 6** 作为开发与打包引擎，搭配 **@vitejs/plugin-react** 提供 React JSX/TSX 支持。TypeScript 通过 `tsc -b`（Project References）进行类型检查与增量编译，但本身不产出 JS 文件（`noEmit: true`），最终产物由 Vite 生成。

样式管线：TailwindCSS 3 + PostCSS + Autoprefixer，配置文件位于根目录 `tailwind.config.js`、`postcss.config.js`。

包管理器：npm（存在 `package-lock.json`），项目标记为 `private`，无发布到 npm 的意图。

## 2. 关键文件

- `package.json`：脚本入口、依赖声明（运行时依赖 dexie/zustand/framer-motion/react；开发依赖 vite/vite-plugin-react/tailwindcss/typescript）
- `vite.config.ts`：仅启用 react 插件，其余使用默认配置
- `tsconfig.json`：ES2020 target、ESNext module、strict 全开、moduleResolution=bundler
- `tailwind.config.js`、`postcss.config.js`：样式预处理链
- `index.html`：Vite 入口 HTML

## 3. 架构与约定

### 脚本约定 (`package.json scripts`)
- `npm run dev` → 启动 Vite 开发服务器
- `npm run build` → 先执行 `tsc -b` 做类型检查与增量编译，再执行 `vite build` 打包静态资源
- `npm run preview` → 本地预览生产构建产物

### TypeScript 编译策略
- `compilerOptions.noEmit = true`：TS 只做类型检查，不输出 `.js` 文件
- `skipLibCheck = true`：跳过第三方库的类型检查，加速构建
- `isolatedModules = true` + `moduleDetection = force`：强制每个模块独立分析，便于 Vite 并行处理
- `jsx = "react-jsx"`：使用 React 17+ 的新 JSX 转换，无需显式 import React
- `include: ["src"]`：仅编译 `src/` 目录

### Vite 构建配置
- 当前 `vite.config.ts` 极其精简，仅注册 react 插件，其他能力（别名、代理、优化等）全部走 Vite 默认值
- 未配置自定义 `build.outDir`，产物默认进入 `dist/`

### 版本管理
- `package.json.version = "0.1.0"`，版本号硬编码在源码中，没有独立的版本文件或自动化发布流程

## 4. 观察到的约束与规则

- **构建顺序约束**：`build` 脚本将 `tsc -b` 放在 `vite build` 之前，意味着 TypeScript 类型检查失败时不会继续打包（由 shell 命令串联保证）。
- **严格模式约束**：`tsconfig.json` 开启 `strict`、`noUnusedLocals`、`noUnusedParameters`、`noFallthroughCasesInSwitch`、`noUncheckedSideEffectImports`，任何违反这些规则的代码都无法通过类型检查。
- **模块解析约束**：`moduleResolution: "bundler"` 配合 `allowImportingTsExtensions: true`，允许 `.ts/.tsx` 后缀导入，且按 bundler 语义解析（与 Vite 行为对齐）。
- **目标平台约束**：`target: "ES2020"`，产物面向支持 ES2020 语法的现代浏览器。

## 5. 缺失项（未发现）

仓库中不存在以下构建相关工件：Makefile、Dockerfile、CI 流水线（如 .github/workflows、.gitlab-ci.yml）、发布脚本、cross-env/cross-compilation 配置、版本号自动化机制。因此本项目的构建系统仅限于本地开发/打包阶段，不涉及容器化或 CI/CD。