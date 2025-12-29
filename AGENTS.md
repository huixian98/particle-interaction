# Repository Guidelines

## 项目结构与模块组织
整个应用基于 Vue 3 + Vite，核心代码位于 `src/`，其中 `components/` 保存可复用组件，`views/` 承载路由页面，`router/` 和 `stores/` 分别封装导航与 Pinia 状态；`composables/`、`utils/` 收纳可组合逻辑与工具函数。`src/assets/` 适合放置与组件绑定的静态资源，`public/` 用于无需打包处理的公共文件。端到端用例位于 `e2e/tests`，Playwright 配置在仓库根目录的 `playwright.config.ts`。

## 构建、测试与开发命令
使用 `npm run dev` 启动热更新开发服务器，`npm run preview` 复查生产构建产物。生产构建通过 `npm run build`，其会先执行 `npm run type-check`，随后调用 `npm run build-only` 完成打包。单元测试由 `npm run test:unit` 驱动 Vitest，端到端测试使用 `npm run test:e2e`（首次运行前执行 `npx playwright install`）。`npm run lint` 结合 ESLint 与缓存自动修复问题，`npm run format` 通过 Prettier 统一 `src/` 代码风格。

## 编码风格与命名约定
项目采用 TypeScript 与 `<script setup>` 单文件组件，默认使用两空格缩进。组件、视图与 Pinia store 统一使用 PascalCase 文件名（例如 `ParticlePanel.vue`、`HandStore.ts`），组合式函数和工具函数保持 camelCase。提交前需确保通过 `npm run lint` 以及 `npm run format`，避免手动更改生成文件，静态常量集中在 `src/utils` 或 `src/stores` 统一导出。

## 测试规范
Vitest 期望测试文件命名为 `*.spec.ts`，可与被测文件同目录或放入 `src/__tests__/`。测试应覆盖核心交互（指尖识别、粒子行为）并验证 store 状态及路由守卫。Playwright 场景与 `e2e/tests` 中的 spec 一致，推荐在提交前运行 `npm run build && npm run test:e2e -- --project=chromium` 以覆盖生产环境静态资源。CI 环境请缓存 `node_modules` 与 `.vite` 输出以加速重复执行。

## 提交与合并请求指南
Git 历史遵循类 Conventional Commits，例如 `feat: 粒子`、`fix: merge conflict`。请使用 `type(scope?): subject` 模式，保持 subject 简洁（不超过 60 个字符）并描述外显效果。PR 描述需包含变更摘要、验证步骤（列出执行过的 npm 命令）与相关截图或录屏；若关联 issue，使用 `Closes #ID` 语法自动关闭。确保 PR 仅聚焦单一主题，含破坏性修改时在描述中强调迁移步骤。

## 安全与配置提示
本仓库要求 Node.js `^20.19.0` 或 `>=22.12.0`，在多人协作环境中请锁定同一 npm 版本并提交 `package-lock.json`。Playwright 浏览器包体积较大，建议本地与 CI 使用 `npx playwright install --with-deps chromium` 以保持一致；若需接入 Mediapipe 摄像头权限，请在开发浏览器中开启 HTTPS 或 localhost 并主动授予相机访问。
