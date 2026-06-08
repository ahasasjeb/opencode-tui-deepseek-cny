`opencode-tui-plugin-api-reference.md`是OpenCode插件API
`opencode`文件夹是opencode源代码，由于这是个开源项目，用户克隆下载可能没有这个`opencode`文件夹，以实际为准
这是个OpenCode插件项目，不大，自行了解项目
如果你是OpenCode，你会有一个工具可以调用子智能体，但是不要滥用，对于简单的任务，不要调用子智能体，这样只是浪费时间和资源
项目完全建立在bun之上进行开发，若没有bun，则建议用户安装bun

## 项目结构

- `src/index.ts`：插件入口和公开导出。
- `src/version.ts`：插件名称和版本常量。
- `src/utils.ts`：通用类型守卫和辅助函数。
- `src/tui.tsx`：OpenCode TUI 侧栏主组件，负责费用、余额和 Codex/Copilot 额度展示。
- `src/pricing.ts`：模型、渠道、价格、阶梯计费和 session 费用汇总逻辑。
- `src/pricing/`：各提供商定价数据子模块。
  - `types.ts`、`utils.ts`：定价类型与工具函数。
  - `opencode.ts`、`deepseek.ts`、`kimi.ts`、`zhipuai.ts`、`xiaomi.ts`、`alibaba.ts`、`minimax.ts`、`tencent.ts`、`openai.ts`、`anthropic.ts`、`google.ts`、`xai.ts`、`openrouter.ts`：各提供商模型价格定义，按需添加。
- `src/balance.ts`：DeepSeek、moonshot China 余额查询。
- `src/oauth.ts`：本地 OAuth 凭证读取与写入，支持 auth.json / account.json 多路径搜索。
- `src/codex-usage.ts`：本地 OpenAI OAuth 凭据和 Codex 限额查询。
- `src/copilot-usage.ts`：GitHub Copilot OAuth 凭据读取与额度查询（plan、quota、resetDate 等）。
- `src/exchange-rate.ts`：USD/CNY 汇率获取，供美元计价模型换算人民币。
- `src/tui/`：TUI 状态、会话解析、刷新调度、格式化和组件拆分。
  - `state.ts`：全局 TUI 状态管理。
  - `session.ts`：会话数据结构解析与费用计算。
  - `refresh.ts`：余额与限额的定时刷新逻辑。
  - `options.ts`：插件配置项解析（刷新间隔、空展示等）。
  - `format.ts`：通用格式化工具。
  - `components.tsx`：基础 UI 组件（如分隔线）。
  - `copilot-format.ts`、`copilot-components.tsx`：Copilot 额度格式化与面板组件。
  - `codex-format.ts`、`codex-components.tsx`：Codex 限额格式化与面板组件。
- `scripts/build.ts`：构建前脚本（生成版本头、校验等）。
- `test/`：Bun 测试。
  - `pricing.test.ts`：价格计算与阶梯计费。
  - `balance.test.ts`：余额查询解析。
  - `exchange-rate.test.ts`：汇率获取与缓存。
  - `refresh.test.ts`：刷新调度逻辑。
  - `session.test.ts`：会话解析与费用计算。
  - `codex-usage.test.ts`：Codex 限额解析。
  - `codex-components.test.ts`：Codex 组件渲染逻辑。
  - `copilot-usage.test.ts`：Copilot 额度解析与格式化。
- `README.md`：用户文档、支持模型和价格表。
- `opencode-tui-plugin-api-reference.md`：OpenCode 插件 API 参考。
- `opencode/`：可选的 OpenCode 源码目录，不保证每个克隆都有。
- `package.json`、`tsconfig.json`、`bun.lock`：项目配置与依赖锁文件。

运行测试时，需要精确指定测试文件，否则会包含 opencode 本体。

严禁出现循环依赖！！！
请勿使用 any 类型。