## 1. 使用的系统与工具

本项目采用 **Vite + React + TypeScript** 构建，样式方案以 **TailwindCSS** 为核心，通过 `postcss.config.js` 接入 Tailwind 与 `autoprefixer`。组件层使用 `framer-motion` 提供页面/元素级过渡动画（如 `AnimatePresence`、`motion.div`），无独立 CSS-in-JS 或组件库。

## 2. 关键文件

- `tailwind.config.js`：定义设计令牌（颜色）与内容扫描路径
- `src/index.css`：全局基础样式，注入 Tailwind base/components/utilities
- `postcss.config.js`：PostCSS 插件管线（tailwindcss → autoprefixer）
- `src/App.tsx`：应用根组件，集中体现 Tailwind 原子类用法与设计令牌
- `src/pages/*.tsx`、`src/components/*.tsx`：页面与组件，全部使用 Tailwind 原子类命名

## 3. 架构与约定

### 3.1 设计令牌（Design Tokens）

在 `tailwind.config.js` 的 `theme.extend.colors` 中集中声明了 8 个语义化颜色变量，作为全仓唯一配色来源：

| Token | 色值 | 用途 |
|---|---:|---|
| `bg` | `#FAFAF8` | 页面背景 |
| `card` | `#FFFFFF` | 卡片背景 |
| `primary` | `#6C63FF` | 主色 |
| `expense` | `#FF6B6B` | 支出色彩 |
| `income` | `#51CF66` | 收入色彩 |
| `text` | `#2D2D2D` | 主要文字 |
| `sub` | `#999999` | 次要/辅助文字 |
| `border` | `#F0F0F0` | 边框色 |

这些 token 通过 `bg-bg`、`text-text`、`text-sub`、`border-border` 等 Tailwind 工具类被各组件引用，避免硬编码色值散落在 JSX 中。

### 3.2 全局样式基线

`src/index.css` 仅承担三件事：
1. 通过 `@tailwind base/components/utilities` 引入 Tailwind；
2. 设置 `body` 的基础字体栈（含 `-apple-system`、`PingFang SC`、`Microsoft YaHei` 等中英文回退）与反锯齿；
3. 为所有元素重置 `box-sizing: border-box`。

### 3.3 布局策略

- 页面主体使用 `min-h-screen bg-bg` 铺满视口，再嵌套一个 `max-w-md mx-auto px-4 pt-6 pb-24` 的居中容器，将移动端宽度限制在 `md`（768px）以内并做内边距——这是典型的移动端优先单栏布局。
- 页面切换通过 `framer-motion` 的 `AnimatePresence` + `motion.div` 实现淡入上移/上移淡出的转场效果（`initial={{ opacity: 0, y: 8 }}` → `animate={{ opacity: 1, y: 0 }}` → `exit={{ opacity: 0, y: -8 }}`），过渡时长统一为 `0.15s`。

### 3.4 组件级样式约定

- 所有 UI 样式均以 Tailwind 原子类写在 `className` 属性中（仓库内共 10 个 `.tsx` 文件，累计约 225 处 `className=` 引用）。
- 未观察到独立的 `.css` 模块文件或 CSS Modules 使用；也未见 `styled-components`、`emotion`、`less`、`sass` 等预处理器的使用痕迹。
- 颜色一律通过 `text-*`、`bg-*` 访问 tailwind.config 中的 token，未见在组件内直接写十六进制色值的做法（除 `index.css` 中的 body 基础色外）。

## 4. 约定与约束

- **样式入口**：唯一的全局样式入口是 `src/index.css`，由 Vite 自动注入；其他 `.css` 文件不存在于业务代码中。
- **颜色管理**：新增颜色应添加到 `tailwind.config.js` 的 `theme.extend.colors`，而非在组件中硬编码——该配置是唯一受版本控制的颜色源。
- **内容扫描范围**：Tailwind 仅扫描 `./index.html` 与 `./src/**/*.{js,ts,jsx,tsx}`（`tailwind.config.js` 的 `content` 字段），新扩展名需同步更新此列表。
- **PostCSS 管线**：构建链固定为 tailwindcss → autoprefixer（`postcss.config.js`），不允许绕过 PostCSS 直接输出原始 CSS。
- **移动端优先**：布局容器使用 `max-w-md` 限定最大宽度，配合 `px-4` 水平间距，表明目标设备为手机屏幕。
- **字体规范**：全局字体栈在 `src/index.css` 中统一定义，组件不应自行指定 `font-family`。

当前仓库没有发现响应式断点自定义、深色模式、图标系统或设计系统的额外扩展；样式体系保持最小化，完全依赖 Tailwind 原子类与少量全局基础样式。