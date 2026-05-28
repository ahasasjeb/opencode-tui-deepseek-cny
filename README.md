# llm-cny

在 OpenCode TUI 右侧栏显示 DeepSeek V4、moonshot China 的人民币费用和账户余额，Xiaomi MiMo 的人民币费用，以及 Codex 限额。

## 功能

- 统计 `deepseek` 提供商下的 `deepseek-v4-flash`、`deepseek-v4-pro`。
- 统计 `moonshotai-cn` 提供商下的 `kimi-k2.5`、`kimi-k2.6`。
- 统计 `xiaomi` 提供商下的 `mimo-v2.5`、`mimo-v2.5-pro`，仅统计费用，不查余额。
- 检测 `openai` provider 的 OAuth 登录状态并显示 Codex 限额。
- 基于当前 session 的 assistant 消息 token 用量重新计算人民币费用。
- 区分缓存命中输入、缓存未命中输入、输出 token；推理 token 按输出价格计费。
- `deepseek-v4-pro` 使用常态化特价。
- 新会话未使用已支持模型，且未启用 OpenAI OAuth 时只显示激活提示。
- 每次已支持模型回复完成后自动刷新对应余额；Xiaomi MiMo 仅统计费用，不触发余额查询。
- OpenAI OAuth 可用时自动刷新 Codex 限额，OpenAI API Key 模式下不显示该面板。
- 自动复用已有 API Key 读取余额，当前仅适用于 DeepSeek 和 moonshot China，来源依次为：
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
| mimo-v2.5 | 0.02 元 | 1 元 | 2 元 |
| mimo-v2.5-pro | 0.025 元 | 3 元 | 6 元 |

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

- `balanceRefreshMs`：已激活内容的刷新间隔，默认 `600000`，最小 `60000`。用于余额和 Codex 限额刷新。
- `showWhenEmpty`：当前 session 未使用已支持模型且未启用 OpenAI OAuth 时，是否显示激活提示，默认 `true`。

## 说明

DeepSeek 余额接口使用 `GET https://api.deepseek.com/user/balance`，moonshot China 余额接口使用 `GET https://api.moonshot.cn/v1/users/me/balance`。Xiaomi MiMo 暂不支持余额接口，因此只统计费用。Codex 限额通过本地 OpenAI OAuth 凭据查询。插件不会显示或记录 API Key。费用统计只在本地 TUI 中展示，实际扣费与限额以官方账单和官方控制台为准。
