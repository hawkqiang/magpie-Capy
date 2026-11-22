// 真实 smoke：本机 Capy 登录态（或 Magpie 已保存的 capy auth）→ /models → particle-1 "pong"。
// 运行前先 `bun run build`。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import plugin from "../dist/index.mjs";

const capy = await plugin({}, {});

let auth = await (await capy.auth.methods[0].authorize()).callback();
if (auth?.type !== "success") {
  const authPath = path.join(os.homedir(), ".config", "magpie", "plugin-auth.json");
  try {
    const saved = JSON.parse(fs.readFileSync(authPath, "utf8"));
    if (saved?.capy?.access) auth = saved.capy;
  } catch {
    // ignore
  }
}
if (auth?.type === "failed" || !auth?.access) {
  throw new Error(`登录失败：${String(auth?.error ?? "没有本机登录态，也没有已保存的 capy auth")}`);
}

const loader = await capy.auth.loader(async () => auth);
const models = await loader.fetch("https://api.capy.ai/api/v1/models").then((response) => response.json());
console.log(`models: ${models.data?.length ?? 0}`);

const started = Date.now();
const response = await loader.fetch("https://api.capy.ai/api/v1/chat/completions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    model: "particle/particle-1",
    stream: false,
    messages: [{ role: "user", content: "Reply with exactly: pong" }],
  }),
});
const text = await response.text();
console.log(`chat: ${response.status} ${Date.now() - started}ms`);
console.log(text.slice(0, 500));

process.exit(0);
