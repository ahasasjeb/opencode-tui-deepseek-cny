import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { RGBA } from "@opentui/core"
import { For, Match, Show, Switch } from "solid-js"
import type { SessionCostSummary } from "../pricing.js"
import { PLUGIN_NAME } from "../version.js"
import { formatDetails, formatMoney, formatTime, formatTokens } from "./format.js"
import { balanceTone, type BalanceState, type TrackedProvider } from "./state.js"

type Theme = TuiPluginApi["theme"]["current"]

export function Header(props: { theme: Theme; canRefresh: boolean; onRefresh: () => void }) {
  return (
    <box flexDirection="row" justifyContent="space-between">
      <text fg={props.theme.text}>
        <span style={{ fg: props.theme.primary }}>◆</span> <b>LLM CNY</b>
      </text>
      <Show when={props.canRefresh}>
        <text fg={props.theme.textMuted} onMouseDown={props.onRefresh}>
          刷新
        </text>
      </Show>
    </box>
  )
}

export function UpdateBanner(props: {
  theme: Theme
  version: string
  activated: boolean
  onDismiss: () => void
}) {
  return (
    <text fg={props.activated ? props.theme.warning : props.theme.textMuted} wrapMode="word" onMouseDown={props.onDismiss}>
      有新版本 {props.version}，运行 <b>opencode plugin {PLUGIN_NAME}@{props.version} --force</b> 更新
      <Show when={props.activated}>
        <span style={{ fg: props.theme.textMuted }}> · 点击关闭</span>
      </Show>
    </text>
  )
}

export function Summary(props: { theme: Theme; summary: SessionCostSummary; title?: string }) {
  return (
    <box gap={1}>
      <MetricRow theme={props.theme} label="费用" value={formatMoney(props.summary.costCny)} strong />
      <MetricRow theme={props.theme} label="调用" value={`${props.summary.turns} 次`} />
      <text fg={props.theme.textMuted}>
        输入 {formatTokens(props.summary.cacheMissInputTokens)} · 缓存 {formatTokens(props.summary.cacheHitInputTokens)}
      </text>
      <text fg={props.theme.textMuted}>
        输出 {formatTokens(props.summary.outputTokens)} · 推理 {formatTokens(props.summary.reasoningTokens)}
      </text>
      <For each={props.summary.models}>
        {(item) => (
          <box>
            <MetricRow
              theme={props.theme}
              label={`${item.providerLabel} ${item.modelLabel}`}
              value={`${item.turns} 次 · ${formatMoney(item.costCny)}`}
            />
          </box>
        )}
      </For>
    </box>
  )
}

export function ActivationPrompt(props: { theme: Theme }) {
  return (
    <box gap={1}>
      <text fg={props.theme.textMuted} wrapMode="word">
        使用 DeepSeek 或 moonshot China 模型返回一次消息后激活
      </text>
    </box>
  )
}

export function EmptyUsage(props: { theme: Theme }) {
  return (
    <box gap={1}>
      <MetricRow theme={props.theme} label="费用" value="¥0.0000" strong />
      <text fg={props.theme.textMuted}>本会话暂无已支持模型用量</text>
    </box>
  )
}

export function ProviderBalance(props: {
  theme: Theme
  provider: TrackedProvider
  state: BalanceState
}) {
  const amount = () => (props.state.status === "ready" ? props.state.balance.amount : undefined)
  const tone = () => balanceTone(props.theme, amount())

  return (
    <box gap={1}>
      <text fg={props.theme.textMuted}>余额 · {props.provider.label}</text>
      <Switch>
        <Match when={props.state.status === "idle" || props.state.status === "loading"}>
          <text fg={props.theme.textMuted}>正在读取余额...</text>
        </Match>
        <Match when={props.state.status === "missing"}>
          <text fg={props.theme.warning} wrapMode="word">
            未找到 {props.provider.label} API Key
          </text>
        </Match>
        <Match when={props.state.status === "error"}>
          <text fg={props.theme.error} wrapMode="word">
            {(props.state.status === "error" && props.state.message) || "余额读取失败"}
          </text>
        </Match>
        <Match when={props.state.status === "ready"}>
          <box gap={1}>
            <MetricRow
              theme={props.theme}
              label={props.state.status === "ready" && props.state.balance.isAvailable ? "可用" : "不可用"}
              value={`${props.state.status === "ready" ? props.state.balance.currency : "CNY"} ${
                props.state.status === "ready" ? props.state.balance.totalBalance : "0"
              }`}
              color={tone()}
              strong
            />
            <Show when={props.state.status === "ready" && props.state.balance.details.length > 0}>
              <text fg={props.theme.textMuted}>
                {props.state.status === "ready" ? formatDetails(props.state.balance.details) : ""}
              </text>
            </Show>
            <Show when={amount() !== undefined && amount()! <= 3}>
              <text fg={tone()} wrapMode="word">
                余额偏低，建议去 {props.provider.label} 控制台充值
              </text>
            </Show>
            <text fg={props.theme.textMuted}>余额可能有5分钟延迟，可以手动点击刷新二字</text>
            <text fg={props.theme.textMuted}>
              {props.state.status === "ready" ? formatTime(props.state.updatedAt) : ""}
            </text>
          </box>
        </Match>
      </Switch>
    </box>
  )
}

export function MetricRow(props: {
  theme: Theme
  label: string
  value: string
  strong?: boolean
  color?: RGBA
}) {
  return (
    <box flexDirection="row" justifyContent="space-between" gap={1}>
      <text fg={props.theme.textMuted}>{props.label}</text>
      <text fg={props.color ?? (props.strong ? props.theme.success : props.theme.text)}>
        <Show when={props.strong} fallback={props.value}>
          <b>{props.value}</b>
        </Show>
      </text>
    </box>
  )
}

export function Divider(props: { theme: Theme }) {
  return <text fg={props.theme.borderSubtle}>────────────────────────</text>
}
