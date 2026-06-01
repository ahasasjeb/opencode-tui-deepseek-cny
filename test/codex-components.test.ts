import { expect, test } from "bun:test"
import { formatWindowLabel } from "../src/tui/codex-format.js"

test("Codex 限额周期按月和天显示", () => {
  expect(formatWindowLabel({ usedPercent: 5, windowSeconds: 2_592_000, resetAt: 0 })).toBe("1 个月限额")
  expect(formatWindowLabel({ usedPercent: 12, windowSeconds: 604_800, resetAt: 0 })).toBe("7 天限额")
  expect(formatWindowLabel({ usedPercent: 40, windowSeconds: 14_400, resetAt: 0 })).toBe("4 小时限额")
})
