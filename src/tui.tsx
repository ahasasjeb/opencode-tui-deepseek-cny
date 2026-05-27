/** @jsxImportSource @opentui/solid */
import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@opencode-ai/plugin/tui"
import type { Message } from "@opencode-ai/sdk/v2"
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import { fetchDisplayBalance } from "./balance.js"
import { fetchCodexUsage, type CodexUsage } from "./codex-usage.js"
import { calculateTrackedSession, TRACKED_PROVIDERS, type TrackedProviderID } from "./pricing.js"
import {
  ActivationPrompt,
  Divider,
  EmptyUsage,
  Header,
  ProviderBalance,
  Summary,
  UpdateBanner,
} from "./tui/components.js"
import { CodexUsagePanel } from "./tui/codex-components.js"
import { errorMessage } from "./tui/format.js"
import { parseOptions, type Options } from "./tui/options.js"
import {
  activeTrackedProviders,
  childUsageRefreshKey,
  completedTrackedReplyKey,
  isSubagentSession,
  mergeMessages,
  providerTokens,
  taskChildSessionIDs,
  usageRecords,
} from "./tui/session.js"
import { tokenSignature, type BalanceState, type BalanceStateMap } from "./tui/state.js"
import { PLUGIN_NAME, PLUGIN_VERSION } from "./version.js"

type CodexState =
  | { status: "idle" | "loading" }
  | { status: "ready"; usage: CodexUsage }
  | { status: "error"; message: string }
  | { status: "no-auth" }

const pluginID = "opencode-tui-deepseek-cny"
let versionCheckDone = false

function View(props: { api: TuiPluginApi; options: Options; session_id: string }) {
  const theme = () => props.api.theme.current
  const [balances, setBalances] = createSignal<BalanceStateMap>({})
  const [remoteChildMessages, setRemoteChildMessages] = createSignal<ReadonlyArray<Message>>([])
  const session = createMemo(() => props.api.state.session.get(props.session_id))
  const messages = createMemo(() => props.api.state.session.messages(props.session_id))
  const localChildSessionIDs = createMemo(() => taskChildSessionIDs(props.api, messages()))
  const localChildMessages = createMemo(() =>
    localChildSessionIDs().flatMap((sessionID) => props.api.state.session.messages(sessionID)),
  )
  const usageMessages = createMemo(() => mergeMessages(messages(), localChildMessages(), remoteChildMessages()))
  const tokens = createMemo(() => providerTokens(props.api))
  const activeProviders = createMemo(() => activeTrackedProviders(usageMessages()))
  const activated = createMemo(() => activeProviders().length > 0)
  const completedTrackedReplies = createMemo(() => completedTrackedReplyKey(usageMessages()))
  const childRefreshKey = createMemo(() =>
    childUsageRefreshKey({
      sessionID: props.session_id,
      session: session(),
      localChildSessionIDs: localChildSessionIDs(),
      messages: messages(),
    }),
  )
  const summary = createMemo(() => calculateTrackedSession(usageRecords(usageMessages())))
  const visible = createMemo(() => props.options.showWhenEmpty || activated())
  const [updateVersion, setUpdateVersion] = createSignal<string | null>(null)
  const [updateBannerDismissed, setUpdateBannerDismissed] = createSignal(false)
  const [codexState, setCodexState] = createSignal<CodexState>({ status: "idle" })
  let updateBannerTimer: ReturnType<typeof setTimeout> | undefined

  const dismissUpdateBanner = () => {
    clearTimeout(updateBannerTimer)
    setUpdateBannerDismissed(true)
  }

  const controllers = new Map<TrackedProviderID, AbortController>()
  let previousTokenSignature = tokenSignature(tokens())
  let previousCompletedTrackedReplies = ""
  let childUsageRequest = 0

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

  const refreshChildUsage = async () => {
    const request = ++childUsageRequest
    try {
      const children = await props.api.client.session.children({ sessionID: props.session_id })
      if (request !== childUsageRequest) return

      const ids = new Set<string>(localChildSessionIDs())
      for (const child of children.data ?? []) {
        if (isSubagentSession(child)) ids.add(child.id)
      }

      if (ids.size === 0) {
        setRemoteChildMessages([])
        return
      }

      const responses = await Promise.all(
        [...ids].map((sessionID) => props.api.client.session.messages({ sessionID })),
      )
      if (request !== childUsageRequest) return

      setRemoteChildMessages(responses.flatMap((response) => (response.data ?? []).map((item) => item.info)))
    } catch {
      if (request === childUsageRequest) setRemoteChildMessages([])
    }
  }

  const refreshActive = () => {
    for (const provider of activeProviders()) {
      refreshProvider(provider.id)
    }
  }

  const isOpenAIOAuth = (): boolean => {
    const openai = props.api.state.provider.find((item) => item.id === "openai")
    if (!openai) return false
    // If source is "env" or has a direct key, it's API key mode, not OAuth
    if (openai.source === "env" && openai.key) return false
    // If the key looks like a real API key (sk-...), it's not OAuth
    if (openai.key && openai.key.startsWith("sk-")) return false
    // Check if auth.json has openai oauth entry
    return true
  }

  let codexRequest = 0
  const refreshCodexUsage = async () => {
    if (!isOpenAIOAuth()) {
      setCodexState({ status: "no-auth" })
      return
    }
    const request = ++codexRequest
    setCodexState((prev) => (prev.status === "ready" ? prev : { status: "loading" }))
    try {
      const stateDir = props.api.state.path.state
      const result = await fetchCodexUsage(stateDir)
      if (request !== codexRequest) return
      if (result.ok) {
        setCodexState({ status: "ready", usage: result.usage })
      } else {
        setCodexState({ status: "error", message: result.message })
      }
    } catch (cause) {
      if (request !== codexRequest) return
      setCodexState({ status: "error", message: errorMessage(cause) })
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
    childRefreshKey()
    void refreshChildUsage()
  })

  createEffect(() => {
    const current = completedTrackedReplies()
    if (current === previousCompletedTrackedReplies) return
    previousCompletedTrackedReplies = current
    if (current === "") return
    refreshActive()
  })

  createEffect(() => {
    if (!activated() || !updateVersion() || updateBannerDismissed()) return
    clearTimeout(updateBannerTimer)
    updateBannerTimer = setTimeout(() => {
      setUpdateBannerDismissed(true)
    }, 7000)
    onCleanup(() => clearTimeout(updateBannerTimer))
  })

  onMount(() => {
    const interval = setInterval(() => {
      if (activated()) refreshActive()
    }, props.options.balanceRefreshMs)
    onCleanup(() => clearInterval(interval))

    const codexInterval = setInterval(refreshCodexUsage, props.options.balanceRefreshMs)
    onCleanup(() => clearInterval(codexInterval))

    void refreshCodexUsage()

    if (!versionCheckDone) {
      versionCheckDone = true
      void checkLatestVersion(setUpdateVersion)
    }
  })

  onCleanup(() => {
    clearTimeout(updateBannerTimer)
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
          onRefresh={() => {
            refreshActive()
            void refreshCodexUsage()
          }}
        />
        <CodexUsagePanel theme={props.api.theme.current} state={codexState()} />
        <Divider theme={props.api.theme.current} />
        <Show when={updateVersion() !== null && (!activated() || !updateBannerDismissed())}>
          <Show when={updateVersion()}>
            {(version) => (
            <UpdateBanner
              theme={props.api.theme.current}
              version={version()}
              activated={activated()}
              onDismiss={activated() ? dismissUpdateBanner : undefined}
            />
            )}
          </Show>
        </Show>
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

async function checkLatestVersion(setUpdateVersion: (version: string) => void) {
  try {
    const res = await fetch(`https://registry.npmjs.org/${PLUGIN_NAME}`)
    if (!res.ok) return
    const data = (await res.json()) as { ["dist-tags"]?: { latest?: string } }
    const latest = data["dist-tags"]?.latest
    if (latest && latest !== PLUGIN_VERSION) {
      setUpdateVersion(latest)
    }
  } catch {
    // silently ignore network errors
  }
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
