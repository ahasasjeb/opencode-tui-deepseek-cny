# llm-cny

在 OpenCode TUI 右侧栏显示 DeepSeek V4、Kimi CN 的人民币费用和账户余额。

## 功能

- 统计 `deepseek` 提供商下的 `deepseek-v4-flash`、`deepseek-v4-pro`。
- 统计 `moonshotai-cn` 提供商下的 `kimi-k2.5`、`kimi-k2.6`。
- 基于当前 session 的 assistant 消息 token 用量重新计算人民币费用。
- 区分缓存命中输入、缓存未命中输入、输出 token；推理 token 按输出价格计费。
- `deepseek-v4-pro` 使用常态化特价。
- 新会话未使用已支持模型时只显示激活提示，不显示费用和余额信息。
- 每次已支持模型回复完成后自动刷新对应余额，仍可手动点击“刷新”或按间隔自动刷新。
- 自动复用已有 API Key 读取余额，来源依次为：
  - OpenCode provider 的 `key`
  - provider `options.apiKey`
  - provider 声明的环境变量，例如 `DEEPSEEK_API_KEY`、`MOONSHOT_API_KEY`
  - 当前进程的 `DEEPSEEK_API_KEY`、`MOONSHOT_API_KEY`
  - OpenCode 配置里的 `provider.<id>.options.apiKey`

## 价格

单位为人民币 / 百万 tokens。

| 模型 | 缓存命中输入 | 缓存未命中输入 | 输出 |
| --- | ---: | ---: | ---: |
| deepseek-v4-flash | 0.02 元 | 1 元 | 2 元 |
| deepseek-v4-pro | 0.025 元 | 3 元 | 6 元 |
| kimi-k2.5 | 0.7 元 | 4 元 | 21 元 |
| kimi-k2.6 | 1.1 元 | 6.5 元 | 27 元 |

## 安装

```bash
opencode plugin llm-cny
```

或在 `.opencode/tui.jsonc` 中手动添加：

```jsonc
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    [
      "llm-cny",
      {
        "balanceRefreshMs": 600000,
        "showWhenEmpty": true
      }
    ]
  ]
}
```

## 本地开发

```bash
bun install
bun test
bun run typecheck
bun run build
```

本地调试时可以把插件入口写进 `.opencode/tui.jsonc`：

```jsonc
{
  "plugin": ["./llm-cny/src/tui.tsx"]
}
```

## 配置

- `balanceRefreshMs`：DeepSeek 激活后的余额刷新间隔，默认 `600000`，最小 `60000`。
- `showWhenEmpty`：当前 session 未使用 DeepSeek 时是否显示激活提示，默认 `true`。

## 说明

DeepSeek 余额接口使用 `GET https://api.deepseek.com/user/balance`，Kimi CN 余额接口使用 `GET https://api.moonshot.cn/v1/users/me/balance`。插件不会显示或记录 API Key。费用统计只在本地 TUI 中展示，实际扣费以官方账单为准。
