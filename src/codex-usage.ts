import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
const TOKEN_URL = "https://auth.openai.com/oauth/token"
const USAGE_URL = "https://chatgpt.com/backend-api/wham/usage"

export type WindowLimit = {
  usedPercent: number
  windowSeconds: number
  resetAt: number
}

export type CodexUsage = {
  planType: string
  primary: WindowLimit | null
  secondary: WindowLimit | null
}

export type CodexUsageResult =
  | { ok: true; usage: CodexUsage }
  | { ok: false; message: string }

type OAuthCredential = {
  type: "oauth"
  access: string
  refresh: string
  expires: number
  accountId?: string
}

type AuthFile = Record<string, { type: string; access?: string; refresh?: string; expires?: number; accountId?: string }>

function parseWindowLimit(obj: unknown): WindowLimit | null {
  if (!obj || typeof obj !== "object") return null
  const record = obj as Record<string, unknown>
  const usedPercent = typeof record.used_percent === "number" ? record.used_percent : 0
  const windowSeconds = typeof record.limit_window_seconds === "number" ? record.limit_window_seconds : 0
  const resetAt = typeof record.reset_at === "number" ? record.reset_at : 0
  if (usedPercent === 0 && windowSeconds === 0) return null
  return { usedPercent, windowSeconds, resetAt }
}

export async function readCodexOAuth(stateDir: string): Promise<OAuthCredential | null> {
  try {
    const raw = await readFile(join(stateDir, "auth.json"), "utf-8")
    const data = JSON.parse(raw) as AuthFile
    const entry = data.openai
    if (!entry || entry.type !== "oauth" || !entry.access || !entry.refresh) return null
    return {
      type: "oauth",
      access: entry.access,
      refresh: entry.refresh,
      expires: typeof entry.expires === "number" ? entry.expires : 0,
      accountId: entry.accountId,
    }
  } catch {
    return null
  }
}

async function refreshToken(refreshToken: string): Promise<{ access: string; refresh: string; expires: number; accountId?: string } | null> {
  try {
    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })
    if (!response.ok) return null
    const data = (await response.json()) as Record<string, unknown>
    const access = typeof data.access_token === "string" ? data.access_token : ""
    if (!access) return null
    const newRefresh = typeof data.refresh_token === "string" ? data.refresh_token : refreshToken
    const expiresIn = typeof data.expires_in === "number" ? data.expires_in : 3600
    return { access, refresh: newRefresh, expires: Date.now() + expiresIn * 1000 }
  } catch {
    return null
  }
}

async function saveRefreshedToken(stateDir: string, cred: OAuthCredential): Promise<void> {
  try {
    const filePath = join(stateDir, "auth.json")
    const raw = await readFile(filePath, "utf-8")
    const data = JSON.parse(raw) as AuthFile
    if (data.openai && data.openai.type === "oauth") {
      data.openai.access = cred.access
      data.openai.refresh = cred.refresh
      data.openai.expires = cred.expires
      if (cred.accountId) data.openai.accountId = cred.accountId
      await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8")
    }
  } catch {
    // silently ignore
  }
}

async function fetchUsageRaw(accessToken: string, accountId?: string): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "opencode-codex-usage/1.0",
  }
  if (accountId) headers["ChatGPT-Account-Id"] = accountId
  return fetch(USAGE_URL, { headers })
}

function parseUsageResponse(body: string): CodexUsageResult {
  try {
    const data = JSON.parse(body) as Record<string, unknown>
    const planType = typeof data.plan_type === "string" ? data.plan_type : ""
    const rateLimit = data.rate_limit as Record<string, unknown> | undefined
    const primary = parseWindowLimit(rateLimit?.primary_window)
    const secondary = parseWindowLimit(rateLimit?.secondary_window)
    return { ok: true, usage: { planType, primary, secondary } }
  } catch {
    return { ok: false, message: "响应格式解析失败" }
  }
}

export async function fetchCodexUsage(stateDir: string): Promise<CodexUsageResult> {
  const cred = await readCodexOAuth(stateDir)
  if (!cred) return { ok: false, message: "未找到 OpenAI OAuth 凭证" }

  let accessToken = cred.access
  let refreshed = false

  // Refresh if expired
  if (cred.expires > 0 && cred.expires < Date.now()) {
    const result = await refreshToken(cred.refresh)
    if (result) {
      accessToken = result.access
      cred.access = result.access
      cred.refresh = result.refresh
      cred.expires = result.expires
      refreshed = true
    }
  }

  let response = await fetchUsageRaw(accessToken, cred.accountId)

  // Retry with refresh on 401/403
  if (response.status === 401 || response.status === 403) {
    const result = await refreshToken(cred.refresh)
    if (result) {
      accessToken = result.access
      cred.access = result.access
      cred.refresh = result.refresh
      cred.expires = result.expires
      refreshed = true
      response = await fetchUsageRaw(accessToken, cred.accountId)
    }
  }

  if (refreshed) {
    await saveRefreshedToken(stateDir, cred)
  }

  if (!response.ok) {
    return { ok: false, message: `HTTP ${response.status}` }
  }

  const body = await response.text()
  return parseUsageResponse(body)
}
