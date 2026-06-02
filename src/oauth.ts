import { readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join } from "node:path"

export function authCandidatePaths(stateDir: string) {
  const candidates = new Set<string>([join(stateDir, "account.json")])
  const stateParent = dirname(stateDir)
  candidates.add(join(stateParent, "opencode", "account.json"))

  for (const base of [
    process.env.XDG_DATA_HOME,
    process.env.LOCALAPPDATA,
    process.env.APPDATA,
    join(homedir(), ".local", "share"),
    join(homedir(), "Library", "Application Support"),
  ]) {
    if (!base) continue
    candidates.add(join(base, "opencode", "account.json"))
    candidates.add(join(base, "opencode", "auth.json"))
  }

  return [...candidates]
}

export async function readOAuthCredential<T>(stateDir: string, parse: (value: unknown) => T | null): Promise<T | null> {
  const fromEnv = parse(JSON.parse(process.env.OPENCODE_AUTH_CONTENT ?? "null"))
  if (fromEnv) return fromEnv

  for (const filePath of authCandidatePaths(stateDir)) {
    try {
      const parsed = parse(JSON.parse(await readFile(filePath, "utf-8")))
      if (parsed) return parsed
    } catch {
      continue
    }
  }

  return null
}

export async function writeOAuthCredential(stateDir: string, update: (value: unknown) => unknown | null): Promise<boolean> {
  for (const filePath of authCandidatePaths(stateDir)) {
    try {
      const raw = await readFile(filePath, "utf-8")
      const next = update(JSON.parse(raw))
      if (!next) continue
      await writeFile(filePath, JSON.stringify(next, null, 2), "utf-8")
      return true
    } catch {
      continue
    }
  }
  return false
}
