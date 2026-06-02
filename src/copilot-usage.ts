import { readOAuthCredential } from "./oauth.js"
import { isRecord } from "./utils.js"

const USER_URL = "https://api.github.com/copilot_internal/user"

export type QuotaSnapshot = {
  quotaId: string
  entitlement: number
  remaining: number
  unlimited: boolean
  overageCount: number
  overagePermitted: boolean
  percentRemaining: number
}

export type CopilotQuota = {
  plan: string
  sku: string
  displayPlan: string
  displaySku: string
  quotaSnapshots: Record<string, QuotaSnapshot>
  resetDate: string | null
}

export type CopilotUsageResult =
  | { ok: true; quota: CopilotQuota }
  | { ok: false; message: string }

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  individual: "Individual",
  individual_pro: "Pro+",
  business: "Business",
  enterprise: "Enterprise",
  pro: "Pro",
  plus: "Plus",
  team: "Team",
  education: "Edu",
}

const SKU_LABELS: Record<string, string> = {
  free_limited_copilot: "Free",
  free_educational_quota: "Edu",
  no_auth_limited_copilot: "NoAuth",
  copilot_individual: "Individual",
  copilot_pro_plus: "Pro+",
  copilot_business: "Business",
  copilot_enterprise: "Enterprise",
  pro: "Pro",
}

export function normalizeCopilotPlan(plan: string, sku: string): string {
  if (sku === "free_limited_copilot") return "free"
  if (sku === "no_auth_limited_copilot") return "free"
  switch (plan) {
    case "individual":
    case "individual_pro":
    case "business":
    case "enterprise":
      return plan
    default:
      return "individual"
  }
}

export function resolveDisplayPlan(plan: string, sku: string): { displayPlan: string; displaySku: string } {
  const normalized = normalizeCopilotPlan(plan, sku)
  const planText = PLAN_LABELS[normalized] ?? normalized
  const skuText = SKU_LABELS[sku] ?? sku
  return { displayPlan: planText, displaySku: skuText }
}

type CopilotOAuthCredential = {
  type: "oauth"
  access: string
  refresh: string
  expires: number
  enterpriseUrl?: string
}

type AuthFile = Record<string, { type: string; access?: string; refresh?: string; expires?: number; enterpriseUrl?: string }>
type AccountFile = {
  version?: number
  accounts?: Record<
    string,
    {
      id?: string
      serviceID?: string
      credential?: { type?: string; access?: string; refresh?: string; expires?: number; enterpriseUrl?: string }
    }
  >
  active?: Record<string, string>
}

function parseCredential(value: unknown): CopilotOAuthCredential | null {
  return parseLegacyCredential(value) ?? parseAccountCredential(value)
}

function parseLegacyCredential(value: unknown): CopilotOAuthCredential | null {
  if (!isRecord(value)) return null
  const entry = (value as AuthFile)["github-copilot"]
  if (!entry || entry.type !== "oauth" || !entry.access || !entry.refresh) return null
  return {
    type: "oauth",
    access: entry.access,
    refresh: entry.refresh,
    expires: typeof entry.expires === "number" ? entry.expires : 0,
    enterpriseUrl: typeof entry.enterpriseUrl === "string" ? entry.enterpriseUrl : undefined,
  }
}

function parseAccountCredential(value: unknown): CopilotOAuthCredential | null {
  if (!isRecord(value)) return null
  const data = value as AccountFile
  const activeID = data.active?.["github-copilot"]
  if (activeID) {
    const active = parseAccountEntry(data.accounts?.[activeID])
    if (active) return active
  }

  for (const entry of Object.values(data.accounts ?? {})) {
    if (entry?.serviceID !== "github-copilot") continue
    const parsed = parseAccountEntry(entry)
    if (parsed) return parsed
  }

  return null
}

function parseAccountEntry(entry: { credential?: { type?: string; access?: string; refresh?: string; expires?: number; enterpriseUrl?: string } } | undefined): CopilotOAuthCredential | null {
  const credential = entry?.credential
  if (!credential || credential.type !== "oauth" || !credential.access || !credential.refresh) return null
  return {
    type: "oauth",
    access: credential.access,
    refresh: credential.refresh,
    expires: typeof credential.expires === "number" ? credential.expires : 0,
    enterpriseUrl: typeof credential.enterpriseUrl === "string" ? credential.enterpriseUrl : undefined,
  }
}

export async function readCopilotOAuth(stateDir: string): Promise<CopilotOAuthCredential | null> {
  return readOAuthCredential(stateDir, parseCredential)
}

function buildApiBaseUrl(enterpriseUrl?: string): string {
  if (!enterpriseUrl) return "https://api.github.com"
  const domain = enterpriseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
  return `https://${domain}`
}

function parseQuotaSnapshot(value: unknown): QuotaSnapshot | null {
  if (!isRecord(value)) return null
  return {
    quotaId: typeof value.quota_id === "string" ? value.quota_id : "",
    entitlement: typeof value.entitlement === "number" ? value.entitlement : -1,
    remaining: typeof value.remaining === "number" ? value.remaining : 0,
    unlimited: typeof value.unlimited === "boolean" ? value.unlimited : false,
    overageCount: typeof value.overage_count === "number" ? value.overage_count : 0,
    overagePermitted: typeof value.overage_permitted === "boolean" ? value.overage_permitted : false,
    percentRemaining: typeof value.percent_remaining === "number" ? value.percent_remaining : 0,
  }
}

export function parseCopilotUserResponse(body: string): CopilotUsageResult {
  try {
    const data = JSON.parse(body) as Record<string, unknown>
    const plan = typeof data.copilot_plan === "string" ? data.copilot_plan : ""
    const sku = typeof data.access_type_sku === "string" ? data.access_type_sku : ""
    const resetDateRaw = data.quota_reset_date_utc ?? data.quota_reset_date
    const resetDate = typeof resetDateRaw === "string" ? resetDateRaw : null

    const snapshots: Record<string, QuotaSnapshot> = {}
    const rawSnapshots = data.quota_snapshots
    if (isRecord(rawSnapshots)) {
      for (const [key, value] of Object.entries(rawSnapshots)) {
        const snapshot = parseQuotaSnapshot(value)
        if (snapshot) snapshots[key] = snapshot
      }
    }

    return {
      ok: true,
      quota: { plan, sku, ...resolveDisplayPlan(plan, sku), quotaSnapshots: snapshots, resetDate },
    }
  } catch {
    return { ok: false, message: "响应格式解析失败" }
  }
}

export async function fetchCopilotUsage(stateDir: string): Promise<CopilotUsageResult> {
  const cred = await readCopilotOAuth(stateDir)
  if (!cred) return { ok: false, message: "未找到 GitHub Copilot OAuth 凭证" }

  const baseUrl = buildApiBaseUrl(cred.enterpriseUrl)
  const token = cred.refresh || cred.access

  const headers: Record<string, string> = {
    Authorization: `token ${token}`,
    "User-Agent": "opencode-copilot-usage/1.0",
    Accept: "application/json",
    "X-GitHub-Api-Version": "2025-04-01",
  }

  try {
    const response = await fetch(`${baseUrl}/copilot_internal/user`, { headers })

    if (response.status === 401 || response.status === 403) {
      return { ok: false, message: "认证失败或无权限访问 Copilot 额度" }
    }

    if (response.status === 404) {
      return { ok: false, message: "Copilot 额度接口不可用（可能非 Copilot 用户）" }
    }

    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}` }
    }

    const body = await response.text()
    return parseCopilotUserResponse(body)
  } catch (cause) {
    if (cause instanceof Error) return { ok: false, message: cause.message }
    return { ok: false, message: String(cause) }
  }
}