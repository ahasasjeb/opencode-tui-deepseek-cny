/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import { RGBA } from "@opentui/core"
import { createEffect, createMemo, createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import { fetchDeepseekBalance, type DeepseekBalance } from "./balance.js"
import { calculateDeepseekSession, PRO_DISCOUNT_END_BEIJING, type SessionCostSummary } from "./pricing.js"

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
      balance: DeepseekBalance
      updatedAt: number
    }
  | {
      status: "error"
      message: string
    }

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
  const [balance, setBalance] = createSignal<BalanceState>({ status: "idle" })
  const session = createMemo(() => props.api.state.session.get(props.session_id))
  const messages = createMemo(() => props.api.state.session.messages(props.session_id))
  const token = createMemo(() => findDeepseekApiKey(props.api))
  const deepseekActivated = createMemo(() => messages().some(isDeepseekAssistant))
  const completedDeepseekReplies = createMemo(() =>
    messages()
      .flatMap((item) => {
        if (!isDeepseekAssistant(item)) return []
        if (!("completed" in item.time) || item.time.completed === undefined) return []
        return [`${item.id}:${item.time.completed}`]
      })
      .join("|"),
  )
  const summary = createMemo(() =>
    calculateDeepseekSession(
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
  const visible = createMemo(() => props.options.showWhenEmpty || deepseekActivated())

  let previousToken = token() ?? ""
  let previousCompletedDeepseekReplies = ""
  let controller: AbortController | undefined

  const refresh = (current = token()) => {
    controller?.abort()
    if (!current) {
      setBalance({ status: "missing" })
      return
    }

    const next = new AbortController()
    controller = next
    setBalance({ status: "loading" })
    fetchDeepseekBalance(current, next.signal).then(
      (result) => {
        if (next.signal.aborted || controller !== next) return
        if (!result.ok) {
          setBalance({ status: "error", message: result.message })
          return
        }
        setBalance({ status: "ready", balance: result.balance, updatedAt: Date.now() })
      },
      (cause) => {
        if (next.signal.aborted || controller !== next) return
        setBalance({ status: "error", message: errorMessage(cause) })
      },
    )
  }

  createEffect(() => {
    const current = token() ?? ""
    if (current === previousToken) return
    previousToken = current
    if (!deepseekActivated()) return
    refresh(current || undefined)
  })

  createEffect(() => {
    const current = completedDeepseekReplies()
    if (current === previousCompletedDeepseekReplies) return
    previousCompletedDeepseekReplies = current
    if (current === "") return
    refresh()
  })

  onMount(() => {
    const interval = setInterval(() => {
      if (deepseekActivated()) refresh()
    }, props.options.balanceRefreshMs)
    onCleanup(() => clearInterval(interval))
  })

  onCleanup(() => controller?.abort())

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
          canRefresh={deepseekActivated() && token() !== undefined}
          onRefresh={() => refresh()}
        />
        <Show when={deepseekActivated()} fallback={<ActivationPrompt theme={props.api.theme.current} />}>
          <Show when={summary().turns > 0} fallback={<EmptyUsage theme={props.api.theme.current} />}>
            <Summary theme={props.api.theme.current} summary={summary()} title={session()?.title} />
          </Show>
          <Divider theme={props.api.theme.current} />
          <Balance theme={props.api.theme.current} state={balance()} />
        </Show>
      </box>
    </Show>
  )
}

function Header(props: { theme: TuiPluginApi["theme"]["current"]; canRefresh: boolean; onRefresh: () => void }) {
  return (
    <box flexDirection="row" justifyContent="space-between">
      <text fg={props.theme.text}>
        <span style={{ fg: props.theme.primary }}>◆</span> <b>DeepSeek</b>
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
      <MetricRow theme={props.theme} label="调用" value={`${props.summary.turns} 次 V4`} />
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
              label={shortModel(item.modelID)}
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
        使用 DeepSeek 模型返回一次消息后激活
      </text>
    </box>
  )
}

function EmptyUsage(props: { theme: TuiPluginApi["theme"]["current"] }) {
  return (
    <box gap={1}>
      <MetricRow theme={props.theme} label="费用" value="¥0.0000" strong />
      <text fg={props.theme.textMuted}>本会话暂无 V4 用量</text>
    </box>
  )
}

function Balance(props: { theme: TuiPluginApi["theme"]["current"]; state: BalanceState }) {
  const cny = () =>
    props.state.status === "ready" ? props.state.balance.balances.find((item) => item.currency === "CNY") : undefined
  const first = () => (props.state.status === "ready" ? props.state.balance.balances[0] : undefined)
  const item = () => cny() ?? first()
  const amount = () => numberFromBalance(item()?.totalBalance)
  const tone = () => balanceTone(props.theme, amount())

  return (
    <box gap={1}>
      <text fg={props.theme.textMuted}>余额</text>
      <Switch>
        <Match when={props.state.status === "idle" || props.state.status === "loading"}>
          <text fg={props.theme.textMuted}>正在读取余额...</text>
        </Match>
        <Match when={props.state.status === "missing"}>
          <text fg={props.theme.warning} wrapMode="word">
            未找到 DeepSeek API Key
          </text>
        </Match>
        <Match when={props.state.status === "error"}>
          <text fg={props.theme.error} wrapMode="word">
            {(props.state.status === "error" && props.state.message) || "余额读取失败"}
          </text>
        </Match>
        <Match when={props.state.status === "ready" && item() !== undefined}>
          <box gap={1}>
            <MetricRow
              theme={props.theme}
              label={props.state.status === "ready" && props.state.balance.isAvailable ? "可用" : "不可用"}
              value={`${item()!.currency} ${item()!.totalBalance}`}
              color={tone()}
              strong
            />
            <text fg={props.theme.textMuted}>
              赠 {item()!.grantedBalance} · 充 {item()!.toppedUpBalance}
            </text>
            <Show when={amount() !== undefined && amount()! <= 3}>
              <text fg={tone()} wrapMode="word">
                余额偏低，建议去 DeepSeek 控制台充值
              </text>
            </Show>
            <text fg={props.theme.textMuted}>
              余额可能有5分钟延迟，可以手动点击刷新二字
            </text>
            <text fg={props.theme.textMuted}>
              {props.state.status === "ready" ? formatTime(props.state.updatedAt) : ""}
            </text>
          </box>
        </Match>
        <Match when={props.state.status === "ready"}>
          <text fg={props.theme.warning}>余额列表为空</text>
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

function findDeepseekApiKey(api: TuiPluginApi) {
  const provider = api.state.provider.find((item) => item.id === "deepseek")
  const fromProvider = [
    provider?.key,
    readString(provider?.options, "apiKey"),
    ...(provider?.env.map((name) => process.env[name]) ?? []),
    process.env.DEEPSEEK_API_KEY,
    readDeepseekConfigApiKey(api.state.config),
  ].find((item) => typeof item === "string" && item.trim() !== "")

  return fromProvider?.trim()
}

function readDeepseekConfigApiKey(config: unknown) {
  if (!isRecord(config)) return undefined
  if (!isRecord(config.provider)) return undefined
  if (!isRecord(config.provider.deepseek)) return undefined
  if (!isRecord(config.provider.deepseek.options)) return undefined
  return readString(config.provider.deepseek.options, "apiKey")
}

function readString(value: unknown, key: string) {
  if (!isRecord(value)) return undefined
  return typeof value[key] === "string" ? value[key] : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDeepseekAssistant(item: ReturnType<TuiPluginApi["state"]["session"]["messages"]>[number]) {
  if (item.role !== "assistant") return false
  return item.providerID === "deepseek" || item.modelID.startsWith("deepseek-")
}

function numberFromBalance(value: string | undefined) {
  if (value === undefined) return undefined
  const amount = Number(value)
  if (!Number.isFinite(amount)) return undefined
  return amount
}

function balanceTone(theme: TuiPluginApi["theme"]["current"], amount: number | undefined) {
  if (amount === undefined) return theme.success
  if (amount <= 0) return theme.error
  if (amount <= 3) return orange
  if (amount <= 9) return theme.warning
  return theme.success
}

function formatMoney(value: number) {
  return money.format(value)
}

function formatTokens(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toLocaleString("zh-CN")
}

function shortModel(value: string) {
  return value.replace("deepseek-", "").replace("v4-", "v4 ")
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

function errorMessage(cause: unknown) {
  if (cause instanceof Error) return cause.message
  return String(cause)
}
