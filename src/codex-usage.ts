import { readOAuthCredential, writeOAuthCredential } from "./oauth.js"

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
type AccountFile = {
  version?: number
  accounts?: Record<
    string,
    {
      id?: string
      serviceID?: string
      credential?: { type?: string; access?: string; refresh?: string; expires?: number; accountId?: string }
    }
  >
  active?: Record<string, string>
}
type AccountEntry = NonNullable<AccountFile["accounts"]>[string]

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
  return readOAuthCredential(stateDir, parseCredential)
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
  await writeOAuthCredential(stateDir, (raw) => updateStoredCredential(raw, cred))
}

function parseCredential(value: unknown): OAuthCredential | null {
  return parseLegacyCredential(value) ?? parseAccountCredential(value)
}

function parseLegacyCredential(value: unknown): OAuthCredential | null {
  if (!value || typeof value !== "object") return null
  const entry = (value as AuthFile).openai
  if (!entry || entry.type !== "oauth" || !entry.access || !entry.refresh) return null
  return {
    type: "oauth",
    access: entry.access,
    refresh: entry.refresh,
    expires: typeof entry.expires === "number" ? entry.expires : 0,
    accountId: entry.accountId,
  }
}

function parseAccountCredential(value: unknown): OAuthCredential | null {
  if (!value || typeof value !== "object") return null
  const data = value as AccountFile
  const activeID = data.active?.openai
  if (activeID) {
    const active = parseAccountEntry(data.accounts?.[activeID])
    if (active) return active
  }

  for (const entry of Object.values(data.accounts ?? {})) {
    if (entry?.serviceID !== "openai") continue
    const parsed = parseAccountEntry(entry)
    if (parsed) return parsed
  }

  return null
}

function parseAccountEntry(entry: AccountEntry | undefined): OAuthCredential | null {
  const credential = entry?.credential
  if (!credential || credential.type !== "oauth" || !credential.access || !credential.refresh) return null
  return {
    type: "oauth",
    access: credential.access,
    refresh: credential.refresh,
    expires: typeof credential.expires === "number" ? credential.expires : 0,
    accountId: credential.accountId,
  }
}

function updateStoredCredential(value: unknown, cred: OAuthCredential) {
  if (!value || typeof value !== "object") return null

  const legacy = value as AuthFile
  if (legacy.openai?.type === "oauth") {
    legacy.openai.access = cred.access
    legacy.openai.refresh = cred.refresh
    legacy.openai.expires = cred.expires
    if (cred.accountId) legacy.openai.accountId = cred.accountId
    return legacy
  }

  const data = value as AccountFile
  const activeID = data.active?.openai
  if (activeID && data.accounts?.[activeID]?.credential?.type === "oauth") {
    data.accounts[activeID]!.credential!.access = cred.access
    data.accounts[activeID]!.credential!.refresh = cred.refresh
    data.accounts[activeID]!.credential!.expires = cred.expires
    if (cred.accountId) data.accounts[activeID]!.credential!.accountId = cred.accountId
    return data
  }

  for (const entry of Object.values(data.accounts ?? {})) {
    if (entry?.serviceID !== "openai") continue
    if (entry.credential?.type !== "oauth") continue
    entry.credential.access = cred.access
    entry.credential.refresh = cred.refresh
    entry.credential.expires = cred.expires
    if (cred.accountId) entry.credential.accountId = cred.accountId
    return data
  }

  return null
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
