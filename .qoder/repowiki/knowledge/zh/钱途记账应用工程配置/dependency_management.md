## 1. 采用的系统/方案

本项目使用 **npm**（Node.js 生态默认的包管理器）来声明、安装和锁定前端依赖。构建与开发工具链由 Vite 驱动，运行时依赖集中在 React 生态内。没有使用 yarn、pnpm、bun 等替代包管理器，也没有私有 registry、镜像源或 vendoring（如 `node_modules` 未提交）策略。

## 2. 关键文件

- `package.json`：唯一的依赖清单，定义了项目元信息、scripts、`dependencies` 与 `devDependencies`。
- `package-lock.json`：npm lockfile v3，用于锁定所有传递依赖的精确版本，保证可重复安装。
- `tsconfig.json` / `vite.config.ts`：类型检查与构建配置，间接约束依赖版本（如 TypeScript `~5.6.0` 与 Vite `^6.0.0` 的版本区间需兼容）。

## 3. 架构与约定

### 3.1 依赖分类
`package.json` 将依赖明确分为两类：

- **运行时依赖 (`dependencies`)**：`dexie`、`dexie-react-hooks`、`framer-motion`、`react`、`react-dom`、`zustand`。这些是打包产物需要保留的库。
- **开发时依赖 (`devDependencies`)**：`@types/react`、`@types/react-dom`、`@vitejs/plugin-react`、`autoprefixer`、`postcss`、`tailwindcss`、`typescript`、`vite`。仅用于开发/构建阶段。

### 3.2 版本范围策略
- 运行时代码普遍采用 **caret 范围**（如 `^18.3.1`、`^4.0.11`），允许补丁级与次版本升级。
- 对破坏性风险较高的工具（TypeScript）使用 **波浪号范围**（`~5.6.0`），仅允许补丁升级。
- 该仓库未使用固定版本号（如 `18.3.1` 不加前缀），因此 `package-lock.json` 承担锁定职责。

### 3.3 Lockfile 与可重复性
`package-lock.json` 使用 `lockfileVersion: 3`，记录了完整的依赖树（包括传递依赖）的精确版本。安装时应通过 `npm ci`（CI 场景）或 `npm install` 生成/消费此文件，以确保团队成员与 CI 获得一致的依赖图。

### 3.4 Scripts
`package.json` 暴露三个脚本：
- `dev` → `vite`
- `build` → `tsc -b && vite build`（先 TypeScript 编译再 Vite 打包）
- `preview` → `vite preview`

这些脚本是依赖消费的主要入口，也体现了构建链路的顺序约定。

## 4. 约定与约束

- **无私有 registry / 镜像配置**：未发现 `.npmrc`、`package.json` 中的 `registry` 字段或环境变量相关配置；依赖从默认 npm registry 拉取。
- **无 vendoring**：`node_modules` 不在仓库中（参考 `.gitignore`），依赖通过 `package-lock.json` 在每次安装时重建。
- **无依赖审计/安全扫描脚本**：`package.json` 的 scripts 中没有 `audit`、`update`、`deps-check` 等命令，未观察到自动化依赖更新或漏洞扫描流程。
- **版本提升需手动维护**：依赖版本以 caret/wave 形式写在 `package.json` 中，升级时需人工编辑该文件并重新生成 `package-lock.json`；未见 Dependabot、Renovate 等自动化更新配置文件。
- **TypeScript 与构建工具版本耦合**：`build` 脚本先执行 `tsc -b`，要求 `typescript` 与 Vite 插件版本满足 tsconfig 的 moduleResolution 设置（见 `tsconfig.json`），这是隐式但实际存在的版本兼容性约束。