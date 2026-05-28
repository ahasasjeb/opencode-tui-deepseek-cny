export const CODEX_REFRESH_MIN_MS = 43_000
export const CODEX_REFRESH_MAX_MS = 60_000

export function randomCodexRefreshMs(random = Math.random) {
  const range = CODEX_REFRESH_MAX_MS - CODEX_REFRESH_MIN_MS + 1
  return CODEX_REFRESH_MIN_MS + Math.floor(random() * range)
}
