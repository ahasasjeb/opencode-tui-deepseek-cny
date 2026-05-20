import { rm } from "node:fs/promises"
import type { BunPlugin } from "bun"

const solidPlugin: BunPlugin = {
  name: "opentui-solid-jsx",
  setup(build) {
    build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
      const code = await Bun.file(sourcePath(args.path)).text()
      const [babel, solid, ts] = await Promise.all([
        import("@babel/core"),
        import("babel-preset-solid"),
        import("@babel/preset-typescript"),
      ])
      const transformAsync = babel.transformAsync ?? babel.default?.transformAsync
      if (!transformAsync) throw new Error("@babel/core transformAsync is unavailable")

      return {
        contents:
          (
            await transformAsync(code, {
              filename: sourcePath(args.path),
              configFile: false,
              babelrc: false,
              presets: [
                [
                  solid.default ?? solid,
                  {
                    moduleName: "@opentui/solid",
                    generate: "universal",
                  },
                ],
                [
                  ts.default ?? ts,
                  {
                    allExtensions: true,
                    isTSX: true,
                  },
                ],
              ],
            })
          )?.code ?? "",
        loader: "js",
      }
    })
  },
}

await rm("dist", { recursive: true, force: true })

const result = await Bun.build({
  entrypoints: ["./src/index.ts", "./src/tui.tsx"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  packages: "external",
  plugins: [solidPlugin],
})

if (!result.success) {
  for (const item of result.logs) {
    console.error(item.message)
  }
  process.exit(1)
}

function sourcePath(value: string) {
  return value.split(/[?#]/, 1)[0] ?? value
}
