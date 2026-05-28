import { expect, test } from "bun:test"
import { CODEX_REFRESH_MAX_MS, CODEX_REFRESH_MIN_MS, randomCodexRefreshMs } from "../src/tui/refresh.js"

test("Codex refresh interval stays within 43 to 60 seconds", () => {
  expect(randomCodexRefreshMs(() => 0)).toBe(CODEX_REFRESH_MIN_MS)
  expect(randomCodexRefreshMs(() => 0.9999999999999999)).toBe(CODEX_REFRESH_MAX_MS)
})

test("Codex refresh interval remains in range across samples", () => {
  for (let i = 0; i < 200; i += 1) {
    const value = randomCodexRefreshMs()
    expect(value).toBeGreaterThanOrEqual(CODEX_REFRESH_MIN_MS)
    expect(value).toBeLessThanOrEqual(CODEX_REFRESH_MAX_MS)
  }
})
