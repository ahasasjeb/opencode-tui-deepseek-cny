import type { TuiPluginApi } from "@opencode-ai/plugin/tui"
import type { Message, Part, Session } from "@opencode-ai/sdk/v2"
import { TRACKED_PROVIDERS, trackedModel, type TrackedProviderID } from "../pricing.js"
import { isRecord } from "./options.js"
import type { TrackedProvider } from "./state.js"

export function providerTokens(api: TuiPluginApi) {
  const result: Partial<Record<TrackedProviderID, string>> = {}
  for (const provider of TRACKED_PROVIDERS) {
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

function taskChildSessionID(part: Part) {
  if (part.type !== "tool" || part.tool !== "task") return undefined
  const metadata = "metadata" in part.state ? part.state.metadata : undefined
  return readString(metadata, "sessionId")
}

function readString(value: unknown, key: string) {
  if (!isRecord(value)) return undefined
  return typeof value[key] === "string" ? value[key] : undefined
}

function completedTrackedModel(message: Message) {
  if (message.role !== "assistant") return undefined
  if (!("completed" in message.time) || message.time.completed === undefined) return undefined
  return trackedModel(message.providerID, message.modelID)
}
