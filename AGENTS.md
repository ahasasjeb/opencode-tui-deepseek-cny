`opencode-tui-plugin-api-reference.md`是OpenCode插件API
`opencode`文件夹是opencode源代码，由于这是个开源项目，用户克隆下载可能没有这个`opencode`文件夹，以实际为准
这是个OpenCode插件项目，不大，自行了解项目
如果你是OpenCode，你会有一个工具可以调用子智能体，但是不要滥用，对于简单的任务，不要调用子智能体，这样只是浪费时间和资源

## 项目结构

- `src/index.ts`：插件入口和公开导出。
- `src/tui.tsx`：OpenCode TUI 侧栏主组件，负责费用、余额和 Codex 限额展示。
- `src/pricing.ts`：模型、渠道、价格、阶梯计费和 session 费用汇总逻辑。
- `src/balance.ts`：DeepSeek、moonshot China 余额查询。
- `src/codex-usage.ts`：本地 OpenAI OAuth 凭据和 Codex 限额查询。
- `src/exchange-rate.ts`：USD/CNY 汇率获取，供美元计价模型换算人民币。
- `src/tui/`：TUI 状态、会话解析、刷新调度、格式化和组件拆分。
- `scripts/build.ts`：构建前脚本。
- `test/`：Bun 测试，覆盖价格、余额、刷新、session 解析和 Codex 限额。
- `README.md`：用户文档、支持模型和价格表。
- `opencode-tui-plugin-api-reference.md`：OpenCode 插件 API 参考。
- `opencode/`：可选的 OpenCode 源码目录，不保证每个克隆都有。

运行测试时，需要排除`opencode`文件夹

严禁出现循环依赖！！！