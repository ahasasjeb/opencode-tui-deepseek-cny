# llm-cny

在 OpenCode TUI 右侧栏显示 DeepSeek V4、moonshot China 的人民币费用和账户余额，Xiaomi MiMo、ZhipuAI GLM、Alibaba Cloud Qwen、MiniMax M3、OpenRouter/xAI Grok Build 的人民币费用，以及 Codex 限额。

## 功能

- 统计 `deepseek` 提供商下的 `deepseek-v4-flash`、`deepseek-v4-pro`。
- 统计 `moonshotai-cn` 提供商下的 `kimi-k2.5`、`kimi-k2.6`。
- 统计 `xiaomi` 提供商下的 `mimo-v2.5`、`mimo-v2.5-pro`，仅统计费用，不查余额。
- 统计 `zhipuai` 提供商下的 `glm-5.1`、`glm-5-turbo`、`glm-5`，按上下文长度阶梯计费，仅统计费用，不查余额。
- 统计 `alibaba-cn` 提供商下的 `qwen3.7-max`、`qwen3.6-plus`，按上下文长度和当前优惠计费，仅统计费用，不查余额。
- 统计 `minimax-cn` 提供商下的 `minimax-m3`，按上下文长度和 2026-06-08 00:00 前特惠计费，仅统计费用，不查余额。
- 统计 `openrouter` 或 `xai` 提供商下的 `grok-build-0.1`、`x-ai/grok-build-0.1`，后台获取 USD/CNY 汇率并换算为人民币，仅统计费用，不查余额。
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

| 模型 | 上下文 | 缓存命中输入 | 缓存未命中输入 | 输出 |
| --- | --- | ---: | ---: | ---: |
| deepseek-v4-flash | - | 0.02 元 | 1 元 | 2 元 |
| deepseek-v4-pro | - | 0.025 元 | 3 元 | 6 元 |
| kimi-k2.5 | - | 0.7 元 | 4 元 | 21 元 |
| kimi-k2.6 | - | 1.1 元 | 6.5 元 | 27 元 |
| mimo-v2.5 | - | 0.02 元 | 1 元 | 2 元 |
| mimo-v2.5-pro | - | 0.025 元 | 3 元 | 6 元 |
| glm-5.1 | < 32K | 1.3 元 | 6 元 | 24 元 |
| glm-5.1 | >= 32K | 2 元 | 8 元 | 28 元 |
| glm-5-turbo | < 32K | 1.2 元 | 5 元 | 22 元 |
| glm-5-turbo | >= 32K | 1.8 元 | 7 元 | 26 元 |
| glm-5 | < 32K | 1 元 | 4 元 | 18 元 |
| glm-5 | >= 32K | 1.5 元 | 6 元 | 22 元 |
| qwen3.7-max | 限时五折 | 1.2 元 | 6 元 | 18 元 |
| qwen3.6-plus | <= 256K | 2 元 | 2 元 | 12 元 |
| qwen3.6-plus | > 256K | 8 元 | 8 元 | 48 元 |
| minimax-m3 | <= 512K，2026-06-08 00:00 前限时五折 | 0.42 元 | 2.1 元 | 8.4 元 |
| minimax-m3 | <= 512K，2026-06-08 00:00 起 | 0.84 元 | 4.2 元 | 16.8 元 |
| minimax-m3 | > 512K 且 <= 1M | 1.68 元 | 8.4 元 | 33.6 元 |
| grok-build-0.1 / x-ai/grok-build-0.1 | USD/CNY 汇率换算 | 0.2 美元 | 1 美元 | 2 美元 |

ZhipuAI 的上下文档位按本次请求的缓存命中输入与缓存未命中输入之和判断，32K 及以上走高档。
qwen3.7-max 当前按限时五折计价，官方暂未公布结束时间。qwen3.6-plus 超过 256K 上下文会在 TUI 中提示高价档。多轮对话后缓存命中为 0 时，TUI 会显示通用价格警告。
minimax-m3 的上下文档位按本次请求的缓存命中输入与缓存未命中输入之和判断，512K 以上走高档；低档限时五折特惠将于 2026-06-08 00:00:00 +08:00 结束。
Grok Build 价格单位为美元 / 百万 tokens，插件会异步请求 `https://huilv.lzy1.fun/api/huilv` 的 USD/CNY 汇率；成功后自动换算为人民币计费，未获取到汇率前会先显示等待提示。

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

DeepSeek 余额接口使用 `GET https://api.deepseek.com/user/balance`，moonshot China 余额接口使用 `GET https://api.moonshot.cn/v1/users/me/balance`。Xiaomi MiMo、ZhipuAI、Alibaba Cloud、MiniMax 暂不支持余额接口，因此只统计费用。Codex 限额通过本地 OpenAI OAuth 凭据查询。插件不会显示或记录 API Key。费用统计只在本地 TUI 中展示，实际扣费与限额以官方账单和官方控制台为准。
