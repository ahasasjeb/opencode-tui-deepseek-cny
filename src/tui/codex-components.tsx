import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { RGBA } from "@opentui/core"
import { Match, Show, Switch } from "solid-js"
import type { CodexUsage, WindowLimit } from "../codex-usage.js"

type Theme = TuiPluginApi["theme"]["current"]

const BAR_WIDTH = 20
const FILL_CHAR = "█"
const EMPTY_CHAR = "░"

function formatWindowLabel(limit: WindowLimit): string {
  const seconds = limit.windowSeconds
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600} 小时限额`
  if (seconds >= 60) return `${Math.round(seconds / 60)} 分钟限额`
  return "使用限额"
}

function formatResetTime(unixSeconds: number): string {
  if (unixSeconds <= 0) return ""
  const date = new Date(unixSeconds * 1000)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (isToday) {
    return date.toLocaleTimeString("zh-CN", { hour12: false, hour: "2-digit", minute: "2-digit" })
  }
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function ProgressBar(props: { percent: number; theme: Theme }) {
  const remaining = () => Math.max(0, Math.min(100, 100 - props.percent))
  const filled = () => Math.round((remaining() / 100) * BAR_WIDTH)
  const empty = () => BAR_WIDTH - filled()

  const barColor = (): string | RGBA => {
    const r = remaining()
    if (r <= 10) return props.theme.error
    if (r <= 30) return props.theme.warning
    return props.theme.success
  }

  return (
    <box flexDirection="row" gap={1}>
      <text fg={barColor()}>
        {FILL_CHAR.repeat(filled())}
        {EMPTY_CHAR.repeat(empty())}
      </text>
      <text fg={barColor()}>
        <b>{remaining()}%</b>
      </text>
    </box>
  )
}

function LimitRow(props: { limit: WindowLimit; theme: Theme }) {
  return (
    <box gap={0}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={props.theme.textMuted}>{formatWindowLabel(props.limit)}</text>
        <text fg={props.theme.textMuted}>{formatResetTime(props.limit.resetAt)}</text>
      </box>
      <ProgressBar percent={props.limit.usedPercent} theme={props.theme} />
    </box>
  )
}

export function CodexUsagePanel(props: {
  theme: Theme
  state:
    | { status: "idle" | "loading" }
    | { status: "ready"; usage: CodexUsage }
    | { status: "error"; message: string }
    | { status: "no-auth" }
}) {
  const planLabel = (): string => {
    if (props.state.status !== "ready") return ""
    const map: Record<string, string> = {
      free: "Free",
      go: "Go",
      plus: "Plus",
      pro: "Pro",
      prolite: "Pro Lite",
      team: "Business",
      business: "Enterprise",
      enterprise: "Enterprise",
      education: "Edu",
    }
    const raw = props.state.usage.planType.toLowerCase()
    return map[raw] ?? props.state.usage.planType
  }

  return (
    <box gap={1}>
      <box flexDirection="row" justifyContent="space-between">
        <text fg={props.theme.textMuted}>
          Codex 限额
          <Show when={planLabel()}>
            <span> ({planLabel()})</span>
          </Show>
        </text>
      </box>
      <Switch>
        <Match when={props.state.status === "no-auth"}>
          <text fg={props.theme.textMuted}>非 OAuth 登录，无需关注限额</text>
        </Match>
        <Match when={props.state.status === "idle" || props.state.status === "loading"}>
          <text fg={props.theme.textMuted}>正在查询限额...</text>
        </Match>
        <Match when={props.state.status === "error"}>
          <text fg={props.theme.error} wrapMode="word">
            {props.state.status === "error" ? props.state.message : "查询失败"}
          </text>
        </Match>
        <Match when={props.state.status === "ready"}>
          <Show
            when={props.state.status === "ready" && (props.state.usage.primary || props.state.usage.secondary)}
            fallback={<text fg={props.theme.textMuted}>暂无限额数据</text>}
          >
            <Show when={props.state.status === "ready" && props.state.usage.primary}>
              {(primary) => <LimitRow limit={primary()} theme={props.theme} />}
            </Show>
            <Show when={props.state.status === "ready" && props.state.usage.secondary}>
              {(secondary) => <LimitRow limit={secondary()} theme={props.theme} />}
            </Show>
          </Show>
        </Match>
      </Switch>
    </box>
  )
}
