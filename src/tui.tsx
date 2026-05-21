/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { RGBA } from "@opentui/core"
import { createEffect, createMemo, createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import { fetchDisplayBalance, type DisplayBalance } from "./balance.js"
import {
  calculateTrackedSession,
  PRO_DISCOUNT_END_BEIJING,
  TRACKED_PROVIDERS,
  trackedModel,
  type SessionCostSummary,
  type TrackedProviderID,
} from "./pricing.js"

type Options = {
  balanceRefreshMs: number
  showWhenEmpty: boolean
}

type BalanceState =
  | {
      status: "idle" | "loading" | "missing"
    }
  | {
      status: "ready"
      balance: DisplayBalance
      updatedAt: number
    }
  | {
      status: "error"
      message: string
    }

type BalanceStateMap = Partial<Record<TrackedProviderID, BalanceState>>
type TrackedProvider = (typeof TRACKED_PROVIDERS)[number]

const pluginID = "opencode-tui-deepseek-cny"
const defaultBalanceRefreshMs = 600_000
const orange = RGBA.fromInts(255, 135, 0)

const money = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

function View(props: { api: TuiPluginApi; options: Options; session_id: string }) {
  const theme = () => props.api.theme.current
  const [balances, setBalances] = createSignal<BalanceStateMap>({})
  const session = createMemo(() => props.api.state.session.get(props.session_id))
  const messages = createMemo(() => props.api.state.session.messages(props.session_id))
  const tokens = createMemo(() => {
    const result: Partial<Record<TrackedProviderID, string>> = {}
    for (const provider of TRACKED_PROVIDERS) {
      result[provider.id] = findProviderApiKey(props.api, provider)
    }
    return result
  })
  const activeProviders = createMemo(() => {
    const ids = new Set<TrackedProviderID>()
    for (const item of messages()) {
      if (item.role !== "assistant") continue
      const model = trackedModel(item.providerID, item.modelID)
      if (model) ids.add(model.providerID)
    }
    return TRACKED_PROVIDERS.filter((item) => ids.has(item.id))
  })
  const activated = createMemo(() => activeProviders().length > 0)
  const completedTrackedReplies = createMemo(() =>
    messages()
      .flatMap((item) => {
        if (item.role !== "assistant") return []
        if (!trackedModel(item.providerID, item.modelID)) return []
        if (!("completed" in item.time) || item.time.completed === undefined) return []
        return [`${item.id}:${item.time.completed}`]
      })
      .join("|"),
  )
  const summary = createMemo(() =>
    calculateTrackedSession(
      messages().flatMap((item) => {
        if (item.role !== "assistant") return []
        return [
          {
            providerID: item.providerID,
            modelID: item.modelID,
            time: item.time,
            tokens: item.tokens,
          },
        ]
      }),
    ),
  )
  const visible = createMemo(() => props.options.showWhenEmpty || activated())

  const controllers = new Map<TrackedProviderID, AbortController>()
  let previousTokenSignature = tokenSignature(tokens())
  let previousCompletedTrackedReplies = ""

  const setProviderBalance = (providerID: TrackedProviderID, state: BalanceState) => {
    setBalances((current) => ({
      ...current,
      [providerID]: state,
    }))
  }

  const refreshProvider = (providerID: TrackedProviderID, current = tokens()[providerID]) => {
    controllers.get(providerID)?.abort()
    if (!current) {
      setProviderBalance(providerID, { status: "missing" })
      return
    }

    const next = new AbortController()
    controllers.set(providerID, next)
    setProviderBalance(providerID, { status: "loading" })
    fetchDisplayBalance(providerID, current, next.signal).then(
      (result) => {
        if (next.signal.aborted || controllers.get(providerID) !== next) return
        if (!result.ok) {
          setProviderBalance(providerID, { status: "error", message: result.message })
          return
        }
        setProviderBalance(providerID, { status: "ready", balance: result.balance, updatedAt: Date.now() })
      },
      (cause) => {
        if (next.signal.aborted || controllers.get(providerID) !== next) return
        setProviderBalance(providerID, { status: "error", message: errorMessage(cause) })
      },
    )
  }

  const refreshActive = () => {
    for (const provider of activeProviders()) {
      refreshProvider(provider.id)
    }
  }

  createEffect(() => {
    const current = tokenSignature(tokens())
    if (current === previousTokenSignature) return
    previousTokenSignature = current
    if (!activated()) return
    refreshActive()
  })

  createEffect(() => {
    const current = completedTrackedReplies()
    if (current === previousCompletedTrackedReplies) return
    previousCompletedTrackedReplies = current
    if (current === "") return
    refreshActive()
  })

  onMount(() => {
    const interval = setInterval(() => {
      if (activated()) refreshActive()
    }, props.options.balanceRefreshMs)
    onCleanup(() => clearInterval(interval))
  })

  onCleanup(() => {
    for (const controller of controllers.values()) {
      controller.abort()
    }
  })

  return (
    <Show when={visible()}>
      <box
        border
        borderColor={theme().borderSubtle}
        backgroundColor={theme().backgroundElement}
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={1}
        paddingRight={1}
        gap={1}
      >
        <Header
          theme={props.api.theme.current}
          canRefresh={activated() && activeProviders().some((item) => tokens()[item.id] !== undefined)}
          onRefresh={refreshActive}
        />
        <Show when={activated()} fallback={<ActivationPrompt theme={props.api.theme.current} />}>
          <Show when={summary().turns > 0} fallback={<EmptyUsage theme={props.api.theme.current} />}>
            <Summary theme={props.api.theme.current} summary={summary()} title={session()?.title} />
          </Show>
          <Divider theme={props.api.theme.current} />
          <For each={activeProviders()}>
            {(provider) => (
              <ProviderBalance
                theme={props.api.theme.current}
                provider={provider}
                state={balances()[provider.id] ?? { status: "idle" }}
              />
            )}
          </For>
        </Show>
      </box>
    </Show>
  )
}

function Header(props: { theme: TuiPluginApi["theme"]["current"]; canRefresh: boolean; onRefresh: () => void }) {
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

function Summary(props: { theme: TuiPluginApi["theme"]["current"]; summary: SessionCostSummary; title?: string }) {
  return (
    <box gap={1}>
      <MetricRow theme={props.theme} label="费用" value={formatMoney(props.summary.costCny)} strong />
      <MetricRow theme={props.theme} label="调用" value={`${props.summary.turns} 次`} />
      <text fg={props.theme.textMuted}>
        入 {formatTokens(props.summary.cacheMissInputTokens)} · 缓 {formatTokens(props.summary.cacheHitInputTokens)}
      </text>
      <text fg={props.theme.textMuted}>
        出 {formatTokens(props.summary.outputTokens)} · 推 {formatTokens(props.summary.reasoningTokens)}
      </text>
      <For each={props.summary.models}>
        {(item) => (
          <box>
            <MetricRow
              theme={props.theme}
              label={`${item.providerLabel} ${item.modelLabel}`}
              value={`${item.turns} 次 · ${formatMoney(item.costCny)}`}
            />
            <Show when={item.modelID === "deepseek-v4-pro" && item.discountedTurns > 0}>
              <text fg={props.theme.warning} wrapMode="word">
                特价 {item.discountedTurns} 次，至 {formatDiscountEnd()}
              </text>
            </Show>
          </box>
        )}
      </For>
    </box>
  )
}

function ActivationPrompt(props: { theme: TuiPluginApi["theme"]["current"] }) {
  return (
    <box gap={1}>
      <text fg={props.theme.textMuted} wrapMode="word">
        使用 DeepSeek 或 Kimi CN 模型返回一次消息后激活
      </text>
    </box>
  )
}

function EmptyUsage(props: { theme: TuiPluginApi["theme"]["current"] }) {
  return (
    <box gap={1}>
      <MetricRow theme={props.theme} label="费用" value="¥0.0000" strong />
      <text fg={props.theme.textMuted}>本会话暂无已支持模型用量</text>
    </box>
  )
}

function ProviderBalance(props: {
  theme: TuiPluginApi["theme"]["current"]
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

function MetricRow(props: {
  theme: TuiPluginApi["theme"]["current"]
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

function Divider(props: { theme: TuiPluginApi["theme"]["current"] }) {
  return <text fg={props.theme.borderSubtle}>────────────────────────</text>
}

const tui: TuiPlugin = async (api, options) => {
  const config = parseOptions(options)

  api.slots.register({
    order: 150,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} options={config} session_id={props.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id: pluginID,
  tui,
}

export default plugin

function parseOptions(value: unknown): Options {
  if (!isRecord(value)) {
    return {
      balanceRefreshMs: defaultBalanceRefreshMs,
      showWhenEmpty: true,
    }
  }

  return {
    balanceRefreshMs:
      typeof value.balanceRefreshMs === "number" && Number.isFinite(value.balanceRefreshMs)
        ? Math.max(60_000, value.balanceRefreshMs)
        : defaultBalanceRefreshMs,
    showWhenEmpty: typeof value.showWhenEmpty === "boolean" ? value.showWhenEmpty : true,
  }
}

function findProviderApiKey(api: TuiPluginApi, tracked: TrackedProvider) {
  const provider = api.state.provider.find((item) => item.id === tracked.id)
  const fromProvider = [
    provider?.key,
    readString(provider?.options, "apiKey"),
    ...(provider?.env.map((name) => process.env[name]) ?? []),
    ...tracked.env.map((name) => process.env[name]),
    readProviderConfigApiKey(api.state.config, tracked.id),
  ].find((item) => typeof item === "string" && item.trim() !== "")

  return fromProvider?.trim()
}

function readProviderConfigApiKey(config: unknown, providerID: TrackedProviderID) {
  if (!isRecord(config)) return undefined
  if (!isRecord(config.provider)) return undefined
  const provider = config.provider[providerID]
  if (!isRecord(provider)) return undefined
  if (!isRecord(provider.options)) return undefined
  return readString(provider.options, "apiKey")
}

function readString(value: unknown, key: string) {
  if (!isRecord(value)) return undefined
  return typeof value[key] === "string" ? value[key] : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function balanceTone(theme: TuiPluginApi["theme"]["current"], amount: number | undefined) {
  if (amount === undefined) return theme.success
  if (amount <= 0) return theme.error
  if (amount <= 3) return orange
  if (amount <= 9) return theme.warning
  return theme.success
}

function tokenSignature(tokens: Partial<Record<TrackedProviderID, string>>) {
  return TRACKED_PROVIDERS.map((provider) => `${provider.id}:${tokens[provider.id] ?? ""}`).join("|")
}

function formatMoney(value: number) {
  return money.format(value)
}

function formatTokens(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString("zh-CN")
}

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour12: false,
  })
}

function formatDiscountEnd() {
  return new Date(PRO_DISCOUNT_END_BEIJING).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDetails(details: DisplayBalance["details"]) {
  return details.map((item) => `${item.label} ${item.value}`).join(" · ")
}

function errorMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message
  return String(cause)
}
