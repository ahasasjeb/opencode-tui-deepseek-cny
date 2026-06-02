import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { Message, Part, Session } from "@opencode-ai/sdk/v2"
import { BALANCE_TRACKED_PROVIDERS, TRACKED_PROVIDERS, trackedModel, type BalanceProviderID, type TrackedProviderID } from "../pricing.js"
import { isRecord } from "../utils.js"

type ProviderAuthLike = {
  id: string
  source?: string
  key?: string | null | undefined
  env?: readonly string[]
  options?: unknown
}

export function providerTokens(api: TuiPluginApi) {
  const result: Partial<Record<BalanceProviderID, string>> = {}
  for (const provider of BALANCE_TRACKED_PROVIDERS) {
    result[provider.id] = findProviderApiKey(api, provider)
  }
  return result
}

export function activeTrackedProviders(messages: ReadonlyArray<Message>) {
  const ids = new Set<TrackedProviderID>()
  for (const item of messages) {
    const model = completedTrackedModel(item)
    if (model) ids.add(model.providerID)
  }
  return TRACKED_PROVIDERS.filter((item) => ids.has(item.id))
}

export function hasOpenAIOAuthProvider(
  providers: ReadonlyArray<ProviderAuthLike>,
) {
  const openai = providers.find((item) => item.id === "openai")
  if (!openai) return false
  if (hasOpenAIProviderApiKey(openai)) return false
  return true
}

export function hasCopilotOAuthProvider(
  providers: ReadonlyArray<ProviderAuthLike>,
) {
  const copilot = providers.find((item) => item.id === "github-copilot")
  if (!copilot) return false
  if (hasProviderApiKey(copilot)) return false
  return true
}

function hasProviderApiKey(provider: ProviderAuthLike) {
  const candidates = [
    provider.key,
    readString(provider.options, "apiKey"),
    ...(provider.env?.map((name) => process.env[name]) ?? []),
  ]
  return candidates.some((item) => typeof item === "string" && item.trim() !== "")
}

export function hasOpenAIApiKeyProvider(providers: ReadonlyArray<ProviderAuthLike>, config?: unknown) {
  const openai = providers.find((item) => item.id === "openai")
  if (openai && hasOpenAIProviderApiKey(openai)) return true
  const configApiKey = readProviderConfigString(config, "openai", "apiKey")
  return typeof configApiKey === "string" && configApiKey.trim() !== ""
}

export function hasOpenAIUsage(messages: ReadonlyArray<Message>) {
  return messages.some((item) => {
    if (item.role === "user") return item.model.providerID === "openai"
    return item.providerID === "openai"
  })
}

export function completedTrackedReplyKey(messages: ReadonlyArray<Message>) {
  return messages
    .flatMap((item) => {
      if (item.role !== "assistant") return []
      if (!completedTrackedModel(item)) return []
      return [`${item.id}:${item.time.completed}`]
    })
    .join("|")
}

export function usageRecords(messages: ReadonlyArray<Message>) {
  return messages.flatMap((item) => {
    if (item.role !== "assistant") return []
    return [
      {
        providerID: item.providerID,
        modelID: item.modelID,
        time: item.time,
        tokens: item.tokens,
      },
    ]
  })
}

export function childUsageRefreshKey(input: {
  sessionID: string
  session?: Session
  localChildSessionIDs: ReadonlyArray<string>
  messages: ReadonlyArray<Message>
}) {
  return [
    input.sessionID,
    input.session?.time.updated ?? "",
    input.localChildSessionIDs.join(","),
    input.messages
      .map((item) => `${item.id}:${item.role === "assistant" ? (item.time.completed ?? "") : ""}`)
      .join("|"),
  ].join("|")
}

export function taskChildSessionIDs(api: TuiPluginApi, messages: ReadonlyArray<Message>) {
  const result = new Set<string>()
  for (const message of messages) {
    for (const part of api.state.part(message.id)) {
      const sessionID = taskChildSessionID(part)
      if (sessionID) result.add(sessionID)
    }
  }
  return [...result].sort()
}

export function mergeMessages(...groups: ReadonlyArray<ReadonlyArray<Message>>) {
  const result = new Map<string, Message>()
  for (const group of groups) {
    for (const message of group) {
      result.set(message.id, message)
    }
  }
  return [...result.values()]
}

export function isSubagentSession(session: Session) {
  return session.title.includes(" subagent)")
}

function findProviderApiKey(api: TuiPluginApi, tracked: (typeof BALANCE_TRACKED_PROVIDERS)[number]) {
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

function readProviderConfigApiKey(config: unknown, providerID: BalanceProviderID) {
  return readProviderConfigString(config, providerID, "apiKey")
}

function readProviderConfigString(config: unknown, providerID: string, key: string) {
  if (!isRecord(config)) return undefined
  if (!isRecord(config.provider)) return undefined
  const provider = config.provider[providerID]
  if (!isRecord(provider)) return undefined
  if (!isRecord(provider.options)) return undefined
  return readString(provider.options, key)
}

function taskChildSessionID(part: Part) {
  if (part.type !== "tool" || part.tool !== "task") return undefined
  const metadata = "metadata" in part.state ? part.state.metadata : undefined
  return readString(metadata, "sessionId")
}

function readString(value: unknown, key: string) {
  if (!isRecord(value)) return undefined
  return typeof value[key] === "string" ? value[key] : undefined
}

function hasOpenAIProviderApiKey(provider: ProviderAuthLike) {
  const candidates = [
    provider.key,
    readString(provider.options, "apiKey"),
    ...(provider.env?.map((name) => process.env[name]) ?? []),
  ]

  return candidates.some((item) => typeof item === "string" && item.trim() !== "")
}

function completedTrackedModel(message: Message) {
  if (message.role !== "assistant") return undefined
  if (!("completed" in message.time) || message.time.completed === undefined) return undefined
  return trackedModel(message.providerID, message.modelID)
}
