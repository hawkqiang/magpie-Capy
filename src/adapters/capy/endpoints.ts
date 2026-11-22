export const CAPY_ORIGIN = "https://capy.ai";
export const CAPY_FAPI = "https://clerk.capy.ai";
export const CAPY_APP = "https://api.capy.ai/app";
export const CAPY_PUBLIC = "https://api.capy.ai/api/v1";
export const DEVICE_TUNNEL = "wss://device-tunnel-production.cloud.capy.ai/tunnel";
export const CONTRACT_VERSION = 2;

function appHeaders(jwt: string, extra: Record<string, string> = {}): Record<string, string> {
  return {
    authorization: `Bearer ${jwt}`,
    origin: CAPY_ORIGIN,
    referer: `${CAPY_ORIGIN}/`,
    accept: "application/json",
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Capy/0.9.2 Chrome/140.0.0.0 Electron/45.2.3 Safari/537.36",
    "x-capy-client-surface": "desktop",
    "x-capy-client-features": "message-edit,visual",
    "x-capy-client-timezone": timezone(),
    ...extra,
  };
}

export function clientHeaders(jwt: string, extra: Record<string, string> = {}): Record<string, string> {
  return appHeaders(jwt, extra);
}

export function publicHeaders(apiKey: string, extra: Record<string, string> = {}): Record<string, string> {
  return { authorization: `Bearer ${apiKey}`, accept: "application/json", ...extra };
}

function timezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
}
