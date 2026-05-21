# OpenCode TUI 插件接口速查

> 面向写代码的 LLM / Agent 使用。目标是让实现 TUI 插件时不用反复翻源码。
>
> 依据当前项目源码整理，主要来源：
>
> - `packages/plugin/src/tui.ts`：TUI 插件公开类型与 API 类型定义。
> - `packages/opencode/src/cli/cmd/tui/plugin/runtime.ts`：插件加载、启停、生命周期、scoped cleanup。
> - `packages/opencode/src/cli/cmd/tui/plugin/api.tsx`：宿主注入的 API 具体实现。
> - `packages/opencode/src/plugin/shared.ts`、`packages/opencode/src/plugin/loader.ts`：插件入口解析规则。
> - `.opencode/plugins/tui-smoke.tsx`：较完整的 TUI 插件示例。
> - `packages/opencode/src/cli/cmd/tui/feature-plugins/**`：内置 TUI 插件示例。
>
> 注意：TUI 插件接口目前更像半公开接口。最终以 `packages/plugin/src/tui.ts` 的类型为准。

---

## 1. 最小可用插件

TUI 插件默认导出一个对象，包含 `id` 和 `tui(api, options, meta)`。

```ts
import type { TuiPluginModule } from "@opencode-ai/plugin/tui"

export default {
  id: "example.hello",
  tui: async (api, options, meta) => {
    api.ui.toast({
      variant: "info",
      title: "Hello",
      message: `Loaded ${meta.id}`,
    })
  },
} satisfies TuiPluginModule
```

带 JSX / Solid UI 的插件通常需要：

```tsx
/** @jsxImportSource @opentui/solid */
import type { TuiPluginModule } from "@opencode-ai/plugin/tui"

export default {
  id: "example.ui",
  tui: async (api) => {
    api.ui.dialog.replace(() => (
      <api.ui.DialogAlert
        title="Example"
        message="TUI plugin works"
        onConfirm={() => api.ui.dialog.clear()}
      />
    ))
  },
} satisfies TuiPluginModule
```

插件函数签名：

```ts
type TuiPlugin = (
  api: TuiPluginApi,
  options: PluginOptions | undefined,
  meta: TuiPluginMeta,
) => Promise<void>

type TuiPluginModule = {
  id?: string
  tui: TuiPlugin
  server?: never
}
```

重要约束：

- `server` 和 `tui` 不能同时导出。TUI 插件模块只能有 `tui`。
- 本地 path/file 插件必须导出非空字符串 `id`。
- npm 插件可以省略 `id`，此时使用 `package.json.name`。
- `api.command` 是 legacy/deprecated；新插件应使用 `api.keymap.registerLayer()` 和 `api.keymap.dispatchCommand()`。

---

## 2. 配置和加载入口

TUI 插件挂在 `tui.json`，不是普通 `opencode.json`。

```jsonc
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    "./.opencode/plugins/my-tui-plugin.ts",
    ["./.opencode/plugins/plugin-with-options.ts", { "label": "demo" }],
    "some-npm-plugin"
  ]
}
```

`plugin` 每项有两种形式：

```ts
type PluginSpec = string | [string, Record<string, unknown>]
```

对应到插件函数：

```ts
tui: async (api, options, meta) => {
  // options 就是 [spec, options] 里的第二项
}
```

### npm 插件入口规则

npm 包必须在 `package.json` 的 `exports` 里暴露 `./tui`：

```json
{
  "name": "acme-plugin",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./tui": "./tui.js"
  }
}
```

`main` 和 `exports["."]` 不会作为 TUI 入口使用。

### 本地目录入口规则

本地 path 插件解析规则：

1. 如果是文件，直接导入该文件。
2. 如果是目录且有 `package.json`，优先读取 `exports["./tui"]`。
3. 如果目录有 `package.json` 但没有 `exports["./tui"]`，不会 fallback 到 `main`。
4. 如果目录没有 `package.json`，会尝试 `index.ts`、`index.tsx`、`index.js`、`index.mjs`、`index.cjs`。

---

## 3. 插件元信息 `meta`

```ts
type TuiPluginState = "first" | "updated" | "same"

type TuiPluginMeta = {
  state: TuiPluginState
  id: string
  source: "file" | "npm" | "internal"
  spec: string
  target: string
  requested?: string
  version?: string
  modified?: number
  first_time: number
  last_time: number
  time_changed: number
  load_count: number
  fingerprint: string
}
```

常见用途：

```ts
tui: async (api, options, meta) => {
  if (meta.state === "first") {
    api.ui.toast({ message: `First load: ${meta.id}` })
  }
}
```

---

## 4. 生命周期和 cleanup

插件激活时执行 `tui()`。插件停用或 TUI runtime dispose 时会执行 cleanup。

```ts
api.lifecycle.onDispose(() => {
  // 清理 timer、renderer hook、外部资源等
})
```

```ts
const timer = setInterval(() => {}, 1000)
api.lifecycle.onDispose(() => clearInterval(timer))
```

```ts
api.lifecycle.signal.addEventListener("abort", () => {
  // runtime dispose 时会 abort
})
```

运行时会自动 scope 一些 API 的返回 cleanup：

- `api.keymap.registerLayer(...)`
- `api.route.register(...)`
- `api.event.on(...)`
- `api.mode.push(...)`
- `api.attention.soundboard.registerPack(...)`
- `api.slots.register(...)`

也就是说这些注册项一般不必手动 unregister，但显式保存 disposer 并调用仍然可以。

---

## 5. `api` 总览

```ts
type TuiPluginApi = {
  app: TuiApp
  attention: TuiAttention
  command?: TuiCommandApi // deprecated
  keys: TuiKeys
  keymap: TuiKeymap
  mode: TuiModeApi
  route: {
    register: (routes: TuiRouteDefinition[]) => () => void
    navigate: (name: string, params?: Record<string, unknown>) => void
    readonly current: TuiRouteCurrent
  }
  ui: {
    Dialog: (props: TuiDialogProps) => JSX.Element
    DialogAlert: (props: TuiDialogAlertProps) => JSX.Element
    DialogConfirm: (props: TuiDialogConfirmProps) => JSX.Element
    DialogPrompt: (props: TuiDialogPromptProps) => JSX.Element
    DialogSelect: <Value = unknown>(props: TuiDialogSelectProps<Value>) => JSX.Element
    Slot: <Name extends string>(props: TuiSlotProps<Name>) => JSX.Element | null
    Prompt: (props: TuiPromptProps) => JSX.Element
    toast: (input: TuiToast) => void
    dialog: TuiDialogStack
  }
  readonly tuiConfig: Frozen<TuiConfigView>
  kv: TuiKV
  state: TuiState
  theme: TuiTheme
  client: OpencodeClient
  event: TuiEventBus
  renderer: CliRenderer
  slots: TuiSlots
  plugins: {
    list: () => ReadonlyArray<TuiPluginStatus>
    activate: (id: string) => Promise<boolean>
    deactivate: (id: string) => Promise<boolean>
    add: (spec: string) => Promise<boolean>
    install: (spec: string, options?: TuiPluginInstallOptions) => Promise<TuiPluginInstallResult>
  }
  lifecycle: TuiLifecycle
}
```

下面逐项说明。

---

## 6. `api.app`

```ts
type TuiApp = {
  readonly version: string
}
```

用法：

```ts
api.ui.toast({ message: `OpenCode version: ${api.app.version}` })
```

---

## 7. `api.ui.toast`

```ts
type TuiToast = {
  variant?: "info" | "success" | "warning" | "error"
  title?: string
  message: string
  duration?: number
}
```

用法：

```ts
api.ui.toast({
  variant: "success",
  title: "Done",
  message: "Operation finished",
  duration: 2000,
})
```

---

## 8. `api.ui.dialog` 和内置 Dialog 组件

Dialog stack API：

```ts
type TuiDialogStack = {
  replace: (render: () => JSX.Element, onClose?: () => void) => void
  clear: () => void
  setSize: (size: "medium" | "large" | "xlarge") => void
  readonly size: "medium" | "large" | "xlarge"
  readonly depth: number
  readonly open: boolean
}
```

### Alert

```tsx
api.ui.dialog.setSize("medium")
api.ui.dialog.replace(() => (
  <api.ui.DialogAlert
    title="Alert"
    message="Something happened"
    onConfirm={() => api.ui.dialog.clear()}
  />
))
```

```ts
type TuiDialogAlertProps = {
  title: string
  message: string
  onConfirm?: () => void
}
```

### Confirm

```tsx
api.ui.dialog.replace(() => (
  <api.ui.DialogConfirm
    title="Confirm"
    message="Continue?"
    onConfirm={() => {
      api.ui.dialog.clear()
      api.ui.toast({ variant: "success", message: "Confirmed" })
    }}
    onCancel={() => api.ui.dialog.clear()}
  />
))
```

```ts
type TuiDialogConfirmProps = {
  title: string
  message: string
  onConfirm?: () => void
  onCancel?: () => void
}
```

### Prompt

```tsx
api.ui.dialog.replace(() => (
  <api.ui.DialogPrompt
    title="Input"
    placeholder="Type something"
    value="default"
    onConfirm={(value) => {
      api.ui.dialog.clear()
      api.ui.toast({ message: value })
    }}
    onCancel={() => api.ui.dialog.clear()}
  />
))
```

```ts
type TuiDialogPromptProps = {
  title: string
  description?: () => JSX.Element
  placeholder?: string
  value?: string
  busy?: boolean
  busyText?: string
  onConfirm?: (value: string) => void
  onCancel?: () => void
}
```

### Select

```tsx
api.ui.dialog.replace(() => (
  <api.ui.DialogSelect
    title="Pick one"
    options={[
      { title: "Alpha", value: "a", description: "First" },
      { title: "Beta", value: "b", description: "Second" },
    ]}
    onSelect={(item) => {
      api.ui.dialog.clear()
      api.ui.toast({ message: `Selected ${item.title}` })
    }}
  />
))
```

```ts
type TuiDialogSelectOption<Value = unknown> = {
  title: string
  value: Value
  description?: string
  footer?: JSX.Element | string
  category?: string
  disabled?: boolean
  onSelect?: () => void
}

type TuiDialogSelectProps<Value = unknown> = {
  title: string
  placeholder?: string
  options: TuiDialogSelectOption<Value>[]
  flat?: boolean
  onMove?: (option: TuiDialogSelectOption<Value>) => void
  onFilter?: (query: string) => void
  onSelect?: (option: TuiDialogSelectOption<Value>) => void
  skipFilter?: boolean
  current?: Value
}
```

### Generic Dialog wrapper

```tsx
api.ui.dialog.replace(() => (
  <api.ui.Dialog size="large" onClose={() => api.ui.dialog.clear()}>
    <box paddingLeft={2} paddingRight={2}>
      <text>Hello</text>
    </box>
  </api.ui.Dialog>
))
```

```ts
type TuiDialogProps = {
  size?: "medium" | "large" | "xlarge"
  onClose: () => void
  children?: JSX.Element
}
```

---

## 9. `api.ui.Prompt`

`api.ui.Prompt` 是宿主 prompt 组件，可用于替换/扩展 home 或 session prompt slot。

```tsx
api.slots.register({
  slots: {
    home_prompt(ctx, props) {
      return (
        <api.ui.Prompt
          workspaceID={props.workspace_id}
          hint={<text fg={ctx.theme.current.textMuted}>custom prompt</text>}
          placeholders={{
            normal: ["Ask something"],
            shell: ["git status --short"],
          }}
        />
      )
    },
  },
})
```

```ts
type TuiPromptProps = {
  sessionID?: string
  workspaceID?: string
  visible?: boolean
  disabled?: boolean
  onSubmit?: () => void
  ref?: (ref: TuiPromptRef | undefined) => void
  hint?: JSX.Element
  right?: JSX.Element
  showPlaceholder?: boolean
  placeholders?: {
    normal?: string[]
    shell?: string[]
  }
}

type TuiPromptRef = {
  focused: boolean
  current: TuiPromptInfo
  set(prompt: TuiPromptInfo): void
  reset(): void
  blur(): void
  focus(): void
  submit(): void
}
```

`TuiPromptInfo`：

```ts
type TuiPromptInfo = {
  input: string
  mode?: "normal" | "shell"
  parts: Array<FilePart | AgentPart | TextPartLike>
}
```

---

## 10. 路由：`api.route`

```ts
type TuiRouteCurrent =
  | { name: "home" }
  | { name: "session"; params: { sessionID: string; prompt?: unknown } }
  | { name: string; params?: Record<string, unknown> }

type TuiRouteDefinition = {
  name: string
  render: (input: { params?: Record<string, unknown> }) => JSX.Element
}
```

注册自定义页面：

```tsx
api.route.register([
  {
    name: "example.screen",
    render: ({ params }) => (
      <box flexDirection="column" paddingLeft={2}>
        <text>Example screen</text>
        <text>count: {String(params?.count ?? 0)}</text>
      </box>
    ),
  },
])
```

导航：

```ts
api.route.navigate("example.screen", { count: 1 })
api.route.navigate("home")
api.route.navigate("session", { sessionID: "ses_xxx" })
```

读取当前路由：

```ts
const cur = api.route.current
if (cur.name === "session") {
  const sessionID = cur.params.sessionID
}
```

注意：

- `home` 和 `session` 是内置路由名。
- 其它名字会作为 plugin route。
- 同名 route 可能产生覆盖/优先级问题，建议用插件 id 命名空间，如 `my.plugin.screen`。

---

## 11. Keymap：`api.keymap`

`api.keymap` 类型来自 `@opentui/keymap`：

```ts
type TuiKeymap = Keymap<Renderable, KeyEvent>
```

常用方式是注册 layer：

```ts
api.keymap.registerLayer({
  commands: [
    {
      name: "example.open",
      title: "Example: open screen",
      category: "Plugin",
      namespace: "palette",
      slashName: "example-open",
      enabled: () => api.route.current.name !== "example.screen",
      run() {
        api.route.navigate("example.screen")
      },
    },
  ],
  bindings: [{ key: "ctrl+shift+e", cmd: "example.open" }],
})
```

可以手动保留 disposer：

```ts
const off = api.keymap.registerLayer({
  commands: [{ name: "example.ping", run: () => api.ui.toast({ message: "pong" }) }],
  bindings: [{ key: "ctrl+shift+p", cmd: "example.ping" }],
})

api.lifecycle.onDispose(off)
```

运行时会 scope `registerLayer`，通常不写 `onDispose(off)` 也会在插件停用时清理。

### 用 `createBindingLookup` 管理默认键位和用户覆盖

```ts
import { createBindingLookup, type BindingConfig } from "@opencode-ai/plugin/tui"
import type { KeyEvent, Renderable } from "@opencode-ai/plugin/tui"

type MyBindings = BindingConfig<Renderable, KeyEvent>

const defaults: MyBindings = {
  "example.open": "ctrl+shift+e",
  "example.close": "escape,q",
}

const lookup = createBindingLookup(defaults)

api.keymap.registerLayer({
  commands: [
    { name: "example.open", run: () => api.route.navigate("example.screen") },
    { name: "example.close", run: () => api.route.navigate("home") },
  ],
  bindings: lookup.gather("example", ["example.open", "example.close"]),
})
```

绑定值支持：

```ts
"ctrl+x"
"escape,q,backspace"
["<leader>x", "ctrl+shift+x"]
{ key: "ctrl+v", preventDefault: false }
{ key: { name: "x", ctrl: true }, event: "press" }
false
"none"
```

### 显示绑定文本

```ts
const text = api.keys.formatBindings(lookup.get("example.open")) ?? ""
```

```ts
type TuiKeys = {
  formatSequence: (parts: readonly KeySequenceFormatPart[] | undefined) => string
  formatBindings: (bindings: readonly SequenceBindingLike[] | undefined) => string | undefined
}
```

### 在 Solid 组件里用 keymap hook

`.opencode/plugins/tui-smoke.tsx` 使用了：

```ts
import { useBindings, useKeymapSelector } from "@opentui/keymap/solid"
```

示例：

```tsx
useBindings(() => ({
  enabled: () => api.route.current.name === "example.screen" && !api.ui.dialog.open,
  commands: [
    { name: "example.close", run: () => api.route.navigate("home") },
  ],
  bindings: lookup.gather("example.screen", ["example.close"]),
}))
```

---

## 12. 模式栈：`api.mode`

```ts
type TuiModeApi = {
  current: () => string
  push: (mode: string) => () => void
}
```

用法：

```ts
const pop = api.mode.push("example.mode")
api.lifecycle.onDispose(pop)
```

运行时会 scope `mode.push()`，插件停用时会自动 pop。

---

## 13. Slots：`api.slots.register`

slot 是 TUI 插件扩展宿主 UI 的主要机制。

```ts
type TuiSlots = {
  register: {
    (plugin: TuiSlotPlugin): string
    <Slots extends Record<string, object>>(plugin: TuiSlotPlugin<Slots>): string
  }
}
```

注册 sidebar slot：

```tsx
api.slots.register({
  order: 500,
  slots: {
    sidebar_content(ctx, props) {
      return (
        <box flexDirection="column">
          <text fg={ctx.theme.current.text}>Custom sidebar block</text>
          <text fg={ctx.theme.current.textMuted}>session: {props.session_id}</text>
        </box>
      )
    },
  },
})
```

注册 home footer：

```tsx
api.slots.register({
  order: 100,
  slots: {
    home_footer(ctx) {
      return <text fg={ctx.theme.current.textMuted}>custom footer</text>
    },
  },
})
```

注册 home prompt 右侧内容：

```tsx
api.slots.register({
  slots: {
    home_prompt_right(ctx, props) {
      return <text fg={ctx.theme.current.textMuted}>workspace: {props.workspace_id}</text>
    },
  },
})
```

### Host slots

```ts
type TuiHostSlotMap = {
  app: {}
  app_bottom: {}
  home_logo: {}
  home_prompt: {
    workspace_id?: string
    ref?: (ref: TuiPromptRef | undefined) => void
  }
  home_prompt_right: {
    workspace_id?: string
  }
  session_prompt: {
    session_id: string
    visible?: boolean
    disabled?: boolean
    on_submit?: () => void
    ref?: (ref: TuiPromptRef | undefined) => void
  }
  session_prompt_right: {
    session_id: string
  }
  home_bottom: {}
  home_footer: {}
  sidebar_title: {
    session_id: string
    title: string
    share_url?: string
  }
  sidebar_content: {
    session_id: string
  }
  sidebar_footer: {
    session_id: string
  }
}
```

slot context：

```ts
type TuiSlotContext = {
  theme: TuiTheme
}
```

注意：

- `TuiSlotPlugin` 不允许插件自己提供 `id`；runtime 会注入 id。
- `order` 控制同一 slot 中的相对顺序。内置插件也使用 order。
- 插件停用时 slot 会自动 unregister。

---

## 14. `api.ui.Slot`

在自定义 slot 里继续渲染其它 slot，常用于 wrapper/override。

```tsx
api.slots.register({
  slots: {
    home_prompt(ctx, props) {
      return (
        <api.ui.Prompt
          workspaceID={props.workspace_id}
          right={
            <box flexDirection="row" gap={1}>
              <api.ui.Slot name="home_prompt_right" workspace_id={props.workspace_id} />
              <text fg={ctx.theme.current.textMuted}>extra</text>
            </box>
          }
        />
      )
    },
  },
})
```

---

## 15. State：`api.state`

```ts
type TuiState = {
  readonly ready: boolean
  readonly config: SdkConfig
  readonly provider: ReadonlyArray<Provider>
  readonly path: {
    state: string
    config: string
    worktree: string
    directory: string
  }
  readonly vcs: { branch?: string } | undefined
  session: {
    count: () => number
    get: (sessionID: string) => Session | undefined
    diff: (sessionID: string) => ReadonlyArray<TuiSidebarFileItem>
    todo: (sessionID: string) => ReadonlyArray<TuiSidebarTodoItem>
    messages: (sessionID: string) => ReadonlyArray<Message>
    status: (sessionID: string) => SessionStatus | undefined
    permission: (sessionID: string) => ReadonlyArray<PermissionRequest>
    question: (sessionID: string) => ReadonlyArray<QuestionRequest>
  }
  part: (messageID: string) => ReadonlyArray<Part>
  lsp: () => ReadonlyArray<TuiSidebarLspItem>
  mcp: () => ReadonlyArray<TuiSidebarMcpItem>
}
```

常用示例：

```ts
const cwd = api.state.path.directory
const branch = api.state.vcs?.branch
const mcp = api.state.mcp()
const lsp = api.state.lsp()
```

```ts
const cur = api.route.current
if (cur.name === "session") {
  const sessionID = cur.params.sessionID
  const session = api.state.session.get(sessionID)
  const files = api.state.session.diff(sessionID)
  const todos = api.state.session.todo(sessionID)
  const messages = api.state.session.messages(sessionID)
}
```

Sidebar item types：

```ts
type TuiSidebarMcpItem = {
  name: string
  status: McpStatus["status"]
  error?: string
}

type TuiSidebarLspItem = Pick<LspStatus, "id" | "root" | "status">

type TuiSidebarTodoItem = Pick<Todo, "content" | "status">

type TuiSidebarFileItem = {
  file: string
  additions: number
  deletions: number
}
```

---

## 16. KV：`api.kv`

插件可用的简单持久 KV。

```ts
type TuiKV = {
  get: <Value = unknown>(key: string, fallback?: Value) => Value
  set: (key: string, value: unknown) => void
  readonly ready: boolean
}
```

用法：

```ts
const count = api.kv.get<number>("example.count", 0)
api.kv.set("example.count", count + 1)
```

建议 key 加插件命名空间，避免冲突：

```ts
api.kv.set("example.hello.settings", { enabled: true })
```

注意：runtime 自己会用 `plugin_enabled` 这个 key 记录插件启停状态，普通插件不要覆盖它。

---

## 17. Theme：`api.theme`

```ts
type TuiTheme = {
  readonly current: TuiThemeCurrent
  readonly selected: string
  has: (name: string) => boolean
  set: (name: string) => boolean
  install: (jsonPath: string) => Promise<void>
  mode: () => "dark" | "light"
  readonly ready: boolean
}
```

安装并切换插件自带主题：

```ts
await api.theme.install("./my-theme.json")
api.theme.set("my-theme")
```

`install(jsonPath)` 的路径相对插件根目录解析。runtime 会把主题复制到本地或全局 themes 目录。

读取当前颜色：

```tsx
const t = api.theme.current
return <text fg={t.textMuted}>Muted text</text>
```

`TuiThemeCurrent` 包含大量颜色字段，常用：

```ts
primary
secondary
accent
error
warning
success
info
text
textMuted
selectedListItemText
background
backgroundPanel
backgroundElement
backgroundMenu
border
borderActive
borderSubtle
diffAdded
diffRemoved
diffContext
markdownText
markdownHeading
markdownLink
markdownCode
syntaxKeyword
syntaxString
syntaxFunction
thinkingOpacity
```

---

## 18. Event：`api.event`

```ts
type TuiEventBus = {
  on: <Type extends Event["type"]>(
    type: Type,
    handler: (event: Extract<Event, { type: Type }>) => void,
  ) => () => void
}
```

用法：

```ts
api.event.on("session.status", (event) => {
  const sessionID = event.properties.sessionID
  const status = event.properties.status
  if (status.type === "idle") {
    api.ui.toast({ message: `Session idle: ${sessionID}` })
  }
})
```

内置插件中出现过的事件：

```ts
"question.asked"
"question.replied"
"question.rejected"
"permission.asked"
"permission.replied"
"session.status"
"session.error"
```

返回的 disposer 会被 runtime scope，插件停用时自动取消监听。

---

## 19. Attention：通知和声音

```ts
type TuiAttentionWhen = "always" | "focused" | "blurred"

type TuiAttentionSoundName =
  | "default"
  | "question"
  | "permission"
  | "error"
  | "done"
  | "subagent_done"

type TuiAttentionSound =
  | boolean
  | {
      name?: TuiAttentionSoundName
      volume?: number
      when?: TuiAttentionWhen
    }

type TuiAttentionNotification =
  | boolean
  | {
      when?: TuiAttentionWhen
    }

type TuiAttentionNotifyInput = {
  title?: string
  message: string
  notification?: TuiAttentionNotification
  sound?: TuiAttentionSound
}

type TuiAttentionNotifyResult = {
  ok: boolean
  notification: boolean
  sound: boolean
  skipped?:
    | "attention_disabled"
    | "empty_message"
    | "blurred"
    | "focused"
    | "focus_unknown"
    | "renderer_destroyed"
}
```

发送通知/声音：

```ts
await api.attention.notify({
  title: "Build",
  message: "Task completed",
  notification: { when: "blurred" },
  sound: { name: "done", when: "always", volume: 0.8 },
})
```

注册声音包：

```ts
api.attention.soundboard.registerPack({
  id: "example.sounds",
  name: "Example Sounds",
  sounds: {
    done: "./sounds/done.wav",
    error: "./sounds/error.wav",
  },
})

api.attention.soundboard.activate("example.sounds", { persist: true })
```

```ts
type TuiAttentionSoundboard = {
  registerPack(pack: TuiAttentionSoundPack): () => void
  activate(id: string, options?: { persist?: boolean }): boolean
  current(): string
  list(): ReadonlyArray<TuiAttentionSoundPackInfo>
}
```

声音文件路径会相对插件根目录解析。

---

## 20. 插件管理：`api.plugins`

```ts
type TuiPluginStatus = {
  id: string
  source: "file" | "npm" | "internal"
  spec: string
  target: string
  enabled: boolean
  active: boolean
}

type TuiPluginInstallOptions = {
  global?: boolean
}

type TuiPluginInstallResult =
  | { ok: true; dir: string; tui: boolean }
  | { ok: false; message: string; missing?: boolean }
```

列出插件：

```ts
const list = api.plugins.list()
```

启停插件：

```ts
await api.plugins.activate("plugin.id")
await api.plugins.deactivate("plugin.id")
```

安装 npm 插件：

```ts
const out = await api.plugins.install("some-plugin", { global: false })
if (!out.ok) {
  api.ui.toast({ variant: "error", message: out.message })
} else if (!out.tui) {
  api.ui.toast({ variant: "warning", message: "Package has no TUI target" })
} else {
  await api.plugins.add("some-plugin")
}
```

`install()` 会修改配置文件；`add()` 尝试在当前 TUI 会话里加载。

---

## 21. TUI 配置视图：`api.tuiConfig`

`api.tuiConfig` 是冻结的只读配置视图。可读，不要修改。

来自 schema 的主要字段：

```ts
type TuiConfigView = {
  $schema?: string
  theme?: string
  plugin?: PluginSpec[]
  plugin_enabled?: Record<string, boolean>
  leader_timeout: number
  attention: {
    enabled: boolean
    notifications: boolean
    sound: boolean
    volume: number
    sound_pack: string
    sounds: Partial<Record<TuiAttentionSoundName, string>>
  }
  keybinds: TuiBindingLookupView
  scroll_speed?: number
  scroll_acceleration?: {
    enabled: boolean
  }
  diff_style?: "auto" | "stacked"
  mouse?: boolean
}
```

`keybinds` 是 binding lookup view：

```ts
type TuiBindingLookupView = {
  readonly bindings: ReadonlyArray<Binding<Renderable, KeyEvent>>
  get: (command: string) => ReadonlyArray<Binding<Renderable, KeyEvent>>
  has: (command: string) => boolean
  gather: (name: string, commands: readonly string[]) => ReadonlyArray<Binding<Renderable, KeyEvent>>
  pick: (name: string, commands: readonly string[]) => Binding<Renderable, KeyEvent>[]
  omit: (name: string, commands: readonly string[]) => Binding<Renderable, KeyEvent>[]
}
```

用法：

```ts
const hasCommandList = api.tuiConfig.keybinds.has("command.palette.show")
const formatted = api.keys.formatBindings(api.tuiConfig.keybinds.get("command.palette.show"))
```

---

## 22. SDK client：`api.client`

```ts
client: OpencodeClient
```

类型来自 `@opencode-ai/sdk/v2`。这是 SDK client，具体方法以 SDK 类型为准。

用法模式：

```ts
// 具体方法名查 @opencode-ai/sdk/v2 的 OpencodeClient 类型
const client = api.client
```

不要凭空猜 SDK 方法；写代码时让 TypeScript/IDE 读取 `OpencodeClient` 类型。

---

## 23. Renderer：`api.renderer`

```ts
renderer: CliRenderer
```

来自 `@opentui/core`。可以做低层渲染扩展。

示例：给 renderer 增加 post-process，并在 dispose 时清理：

```ts
import { VignetteEffect } from "@opentui/core"

const fx = new VignetteEffect(0.35)
const post = fx.apply.bind(fx)

api.renderer.addPostProcessFn(post)
api.lifecycle.onDispose(() => {
  api.renderer.removePostProcessFn(post)
})
```

---

## 24. Legacy `api.command`，不要新写

类型仍在，但已 deprecated。

```ts
type TuiCommandApi = {
  register: (cb: () => TuiCommand[]) => () => void
  trigger: (value: string) => void
  show: () => void
}
```

旧写法：

```ts
api.command?.register(() => [
  {
    title: "Example",
    value: "example.open",
    onSelect: () => api.route.navigate("example.screen"),
  },
])
```

新写法：

```ts
api.keymap.registerLayer({
  commands: [
    {
      name: "example.open",
      title: "Example",
      category: "Plugin",
      namespace: "palette",
      run: () => api.route.navigate("example.screen"),
    },
  ],
  bindings: [{ key: "ctrl+shift+e", cmd: "example.open" }],
})
```

显示命令面板：

```ts
api.keymap.dispatchCommand("command.palette.show")
```

---

## 25. 完整示例：命令 + 页面 + dialog + slot

```tsx
/** @jsxImportSource @opentui/solid */
import type { TuiPluginModule } from "@opencode-ai/plugin/tui"
import { createBindingLookup, type BindingConfig, type Renderable, type KeyEvent } from "@opencode-ai/plugin/tui"

const routeName = "example.full.screen"
const commands = {
  open: "example.full.open",
  close: "example.full.close",
  toast: "example.full.toast",
}

const defaults: BindingConfig<Renderable, KeyEvent> = {
  [commands.open]: "ctrl+shift+e",
  [commands.close]: "escape,q",
  [commands.toast]: "ctrl+shift+t",
}

export default {
  id: "example.full",
  tui: async (api, options, meta) => {
    const keys = createBindingLookup(defaults)

    api.route.register([
      {
        name: routeName,
        render: ({ params }) => (
          <box flexDirection="column" paddingLeft={2} paddingRight={2} gap={1}>
            <text fg={api.theme.current.primary}>Example screen</text>
            <text fg={api.theme.current.textMuted}>plugin: {meta.id}</text>
            <text fg={api.theme.current.textMuted}>params: {JSON.stringify(params ?? {})}</text>
          </box>
        ),
      },
    ])

    api.keymap.registerLayer({
      commands: [
        {
          name: commands.open,
          title: "Example: open screen",
          category: "Plugin",
          namespace: "palette",
          slashName: "example",
          run() {
            api.route.navigate(routeName, { from: "command" })
          },
        },
        {
          name: commands.close,
          title: "Example: go home",
          category: "Plugin",
          namespace: "palette",
          enabled: () => api.route.current.name === routeName,
          run() {
            api.route.navigate("home")
          },
        },
        {
          name: commands.toast,
          title: "Example: toast",
          category: "Plugin",
          namespace: "palette",
          run() {
            api.ui.toast({ variant: "info", message: "Hello from plugin" })
          },
        },
      ],
      bindings: keys.gather("example.full", [commands.open, commands.close, commands.toast]),
    })

    api.slots.register({
      order: 500,
      slots: {
        home_footer(ctx) {
          const openKey = api.keys.formatBindings(keys.get(commands.open)) ?? ""
          return (
            <box flexDirection="row" gap={1}>
              <text fg={ctx.theme.current.textMuted}>Example plugin loaded.</text>
              <text fg={ctx.theme.current.primary}>{openKey}</text>
            </box>
          )
        },
      },
    })
  },
} satisfies TuiPluginModule
```

配置：

```jsonc
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": [
    ["./.opencode/plugins/example-full.tsx", { "label": "demo" }]
  ]
}
```

---

## 26. 常见坑

1. **npm 包没有 `exports["./tui"]`**  
   TUI runtime 不会用 `main` 或 `exports["."]` 当 TUI 入口。

2. **本地 path 插件没写 `id`**  
   path/file 插件必须显式导出 `id`。

3. **同时导出 `server` 和 `tui`**  
   runtime 会拒绝。一个插件模块只能是 server 或 tui 之一。

4. **忘记 JSX pragma**  
   TSX 插件通常需要文件首行：
   ```tsx
   /** @jsxImportSource @opentui/solid */
   ```

5. **继续使用 `api.command`**  
   它只是兼容旧插件。新代码用 `api.keymap.registerLayer()`。

6. **直接修改 `api.tuiConfig`**  
   这是冻结只读配置视图。需要持久化状态时用 `api.kv`。

7. **slot 里自己写 `id`**  
   `TuiSlotPlugin` 不应提供 `id`，runtime 会自动注入。

8. **全局 keybind 没有 enabled 条件**  
   页面内快捷键建议用 `enabled` 限制当前 route/dialog 状态，避免和宿主冲突。

9. **低层 renderer hook 不清理**  
   `api.renderer.addPostProcessFn()` 这类操作需要用 `api.lifecycle.onDispose()` 清理。

---

## 27. 建议给代码 LLM 的实现策略

实现 TUI 插件时按这个顺序写：

1. 默认导出 `{ id, tui } satisfies TuiPluginModule`。
2. TSX 文件首行加 `/** @jsxImportSource @opentui/solid */`。
3. 把 route name、command name 全部用插件 id 做命名空间。
4. 用 `api.route.register()` 注册页面。
5. 用 `api.keymap.registerLayer()` 注册命令和快捷键。
6. 用 `api.slots.register()` 插入宿主 UI。
7. 用 `api.ui.dialog.replace()` 打开对话框。
8. 用 `api.kv` 保存插件状态。
9. 用 `api.lifecycle.onDispose()` 清理手动注册的外部副作用。
10. 避免使用 deprecated `api.command`。

