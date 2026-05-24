import type { Message } from "@opencode-ai/sdk/v2"
import { expect, test } from "bun:test"
import { activeTrackedProviders } from "../src/tui/session.js"

function assistantMessage(input: {
  providerID: string
  modelID: string
  completed?: number
}): Message {
  return {
    id: `${input.providerID}-${input.modelID}`,
    role: "assistant",
    providerID: input.providerID,
    modelID: input.modelID,
    time: input.completed === undefined ? {} : { completed: input.completed },
  } as Message
}

test("流式中的受支持回复不会激活 provider", () => {
  const providers = activeTrackedProviders([
    assistantMessage({
      providerID: "deepseek",
      modelID: "deepseek-v4-flash",
    }),
  ])

  expect(providers).toEqual([])
})

test("完成后的受支持回复会激活 provider", () => {
  const providers = activeTrackedProviders([
    assistantMessage({
      providerID: "deepseek",
      modelID: "deepseek-v4-flash",
      completed: 1,
    }),
  ])

  expect(providers.map((item) => item.id)).toEqual(["deepseek"])
})
