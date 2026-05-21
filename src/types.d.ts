declare module "@babel/core" {
  const _default: { transformAsync: typeof transformAsync }
  export { _default as default }
  export function transformAsync(
    code: string,
    opts?: Record<string, unknown>,
  ): Promise<{ code?: string | null } | null>
}

declare module "babel-preset-solid" { }

declare module "@babel/preset-typescript" { }
