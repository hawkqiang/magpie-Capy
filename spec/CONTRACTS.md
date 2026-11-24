# CONTRACTS — 外部协议与对外 API

> 这里是 Capy / OpenAI 协议的唯一真相。
> 所有示例均已脱敏；真实 token 不进测试、文档或日志。

## 1. Capy 端点

| 名称 | Base | 鉴权 |
|---|---|---|
| Clerk FAPI | `https://clerk.capy.ai` | `__client` cookie + `Origin: https://capy.ai` |
| Capy App API | `https://api.capy.ai/app` | Clerk session JWT，必须带 `azp: https://capy.ai` |
| Capy Public API | `https://api.capy.ai/api/v1` | `Authorization: Bearer capy_…` |
| Device tunnel | `wss://device-tunnel-production.cloud.capy.ai/tunnel` | `Authorization: Bearer capyd_…` |

## 2. Clerk 换票（azp）

```http
POST https://clerk.capy.ai/v1/client/sessions/{sessionId}/tokens
Content-Type: application/json
Origin: https://capy.ai
Cookie: __client=<clientJwt>

{}
```

响应：

```json
{ "jwt": "<60s JWT，payload 必须含 azp=https://capy.ai>" }
```

规则：

- `Origin` 与 `Authorization` **不能同时出现**。
- 无 `azp` 的 JWT 调 `/app/*` 会 401。
- `__client` 是长期 client JWT，payload 只有 `{id: "client_…", rotating_token}`。

## 3. Capy App API

### 3.1 账号/组织

```http
GET /app/me
GET /app/organizations
```

### 3.2 组织级 API Key

```http
POST /app/orgs/{orgId}/api-keys
{ "name": "magpie-plugin" }
→ { "key": { "id": "key_…", "tokenHint": "capy_…" }, "plaintext": "capy_…" }
```

`plaintext` 只返回一次。Public API 只认这个 key。

### 3.3 设备列表

```http
GET /app/orgs/{orgId}/devices
→ [{ "id": "device_…", "name": "baijiu", "connected": true, … }]
```

### 3.4 设备码配对（无头设备）

```http
POST /app/devices/code
{
  "hostname": "…",
  "os": "win32",
  "arch": "x86_64"
}
→ {
  "userCode": "ABCD-EFGH",
  "deviceCode": "capydc_…",
  "verificationUrl": "https://capy.ai/settings/devices/link#code=ABCD-EFGH",
  "expiresInSeconds": 300,
  "pollIntervalSeconds": 5
}
```

```http
POST /app/orgs/{orgId}/devices/code/approve
{ "userCode": "ABCD-EFGH", "name": "baijiu" }
→ { "status": "approved" }
```

```http
POST /app/devices/code/poll
{ "deviceCode": "capydc_…" }
→ {
  "status": "approved",
  "orgName": "…",
  "enrolled": {
    "orgId": "org_…",
    "device": { "id": "device_…", "name": "baijiu", … },
    "token": "capyd_…"
  }
}
```

等待状态：`pending` / `slow_down`；失败：`denied` / `expired`。

### 3.5 建设备线程

```http
POST /app/orgs/{orgId}/jams
{
  "jamId": "jam_<ULID>",
  "requestId": "<ULID>",
  "clientKey": "<ULID>",
  "message": "…",
  "model": { "modelId": "particle/particle-1", "reasoningMode": "low" },
  "device": { "deviceId": "device_…", "workspace": { "kind": "worktree" } },
  "promptVariant": "minimal"    // 可选；403 时降级
}
→ {
  "id": "jam_…",
  "primaryMachine": { "kind": "device", "machineId": "machine_…", "name": "baijiu" },
  "projectId": null,
  "status": "idle",
  "ask": null
}
```

规则：

- `jamId` / `requestId` 必须是真 ULID（26 位 Crockford base32）。
- projectless 线程必须带 `device`；否则 400。
- `primaryMachine.kind` 必须是 `device`，不能是 `cloud`。

### 3.6 线程状态/中断

```http
GET /app/orgs/{orgId}/jams/{jamId}
POST /app/orgs/{orgId}/jams/{jamId}/interrupt
```

`ask.kind`：`credits` → 402；`desktop` → 503；其他 → 409。

### 3.7 模型目录与默认模型（公开 API）

```http
GET /api/v1/models
→ {
  "items": [{ "id", "name", "billing", "route", "reasoningModes", "fast", "pro", "ultrafast" }],
  "default": {
    "modelId": "zai/glm-5.3-flash-ads",
    "source": "personal",
    "skipped": [{ "modelId": "zai/glm-5.3-flash-ads", "source": "personal", "reason": "…" }]
  }
}
```

- `default.source` ∈ `personal | service_user | slack | linear | org | platform`。
- `skipped` 是默认链里**不能运行**的模型及原因（例如 ads 模型只能在 Capy App 内用）。
- 建线程时省略 `model`，Capy 自己走默认链，并在响应的 `modelDefault` 里报告用了哪个；
  显式指定不能运行的模型会 `ModelSelection.Rejected`，不会自动回退。
- 所以插件不能把 `particle/particle-1` 说成“Capy 的默认模型”；它只是插件的免费兜底选择。
- ADS 模型（`*-ads`）建线程必须带 `x-capy-client-features: …,ads-models`；
  服务端还按出口 IP 放行 **US / CA / UK / AU / NZ / IE**，其它地区返回
  `region_unsupported`。不是浏览器 UA/时区能绕过的。

`reasoningMode` 的协议枚举：

```
none | instant | minimal | low | medium | high | xhigh | max
```

## 4. Device tunnel

```
wss://device-tunnel-production.cloud.capy.ai/tunnel
Authorization: Bearer capyd_…
```

### 4.1 hello

```json
{
  "type": "hello",
  "contractVersion": 2,
  "deviceId": "device_…",
  "hostname": "…",
  "os": "win32",
  "workspaces": [],
  "worktreeBase": "C:\\Users\\…\\.capy\\worktrees",
  "clientVersion": "magpie-headless 1.0"
}
```

### 4.2 session-config

```json
{
  "type": "session-config",
  "backingId": "01…",
  "bearer": "…",
  "transferSecret": "…",
  "pushReports": true,
  "presignedParts": true,
  "driveEngine": false
}
```

### 4.3 ready

```json
{ "type": "workspaces-changed", "workspaces": [] }
{ "type": "ready" }
```

### 4.4 keepalive

- 服务端 `{"type":"ping"}` → 设备 `{"type":"pong"}`。
- 15s 空闲心跳；客户端 idle timeout > 15s。

## 5. Machine RPC（HTTP-over-WS）

### 5.1 帧

```json
{ "type": "open", "streamId": 2, "kind": "invoke", "method": "POST",
  "path": "/v1/invocations?wait=25000",
  "headers": { "content-length": "…", "content-type": "application/json" } }
```

二进制帧：`streamId(4B big-endian) + body bytes`

```json
{ "type": "close", "streamId": 2 }
```

设备响应：

```json
{ "type": "response", "streamId": 2, "status": 200,
  "headers": { "content-type": "application/json", "content-length": "…" } }
```

二进制帧：`streamId + response body`，然后：

```json
{ "type": "close", "streamId": 2 }
```

### 5.2 invocation 请求

```json
{
  "invocationId": "worktree_…",
  "handler": "worktree_ensure",
  "params": { "root": "C:\\…\\jam_…", "checkouts": [] }
}
```

设备只解析 `handler` 与 `params`；未列入 §5.3 的 handler 不执行任何 payload。

### 5.3 已实现 handler（仅控制面）

| handler | params | result |
|---|---|---|
| `worktree_ensure` | `{root}`（`checkouts` / `startFromOrigin` 未使用） | `{root, created, checkouts: []}`；root 为空 → 空 root 成功；root 等于 `worktreeBase` 或其子目录（含 base 内的绝对路径）均可；父目录、`worktreeBase` 之外的绝对路径/不同盘符、路径组件含符号链接 → `MachineServer.Refused` |
| `worktree_list` | 忽略 | `{kind:"worktree_list", entries: []}`（当前不列真实工作区） |
| `volume_landed` | `{mounts:[{mountPath,digest}]}`（`digest` 未使用） | `{kind:"volume_landed", mounts:[{mountPath,current:true}], landing:false, checkpoints:false, directories:[], unretained:[], handback:true}`；除 `mountPath` 外均为常量 |
| `volume_probe` | `{mounts:[…]}` | `{mounts:[{mountPath,state:"current"}]}`（常量占位，不做真实卷校验） |
| `POST /v1/git/capture` | 任意（忽略） | `{repos:[]}`（空 capture） |
| `bash`、`bash_output`、`read`、`write`、`edit`、`file_read`、`file_write`、浏览器/computer 及其他 handler | 按 `jamId` 截获 `bash/shell/run/exec/command/read/file_read/write/file_write/edit` 参数供客户端工具桥转交 | `{status:"succeeded", result:{kind:"failure", isError:true, message:"Tool execution is delegated to the client harness."}}` |
| 其他路径 | — | `{status:"failed", error:{code:"MachineServer.Unavailable", message:"未实现的路径 …"}}` |

**为什么拒绝要返回“成功 + `isError:true`”而不是传输失败**：Capy agent 把 handler 失败当作环境故障，容易重试同一工具；而带 `isError` 的工具结果文本它读得到，可以据此改用客户端契约。这只是诱导，不是强制——上游仍可能无视指令自行重试，见 §11 的边界说明。

**仅控制面**：隧道 handler 没有 activeRoot、不 spawn 子进程、没有 `read` / `write` / `edit` / `file_*` 入口。handler 侧唯一由 machine RPC 触发的文件系统操作是 `worktree_ensure` 在 hello 宣告的 `worktreeBase` 下 `mkdir`，并做越界/符号链接校验；设备 token 的本地持久化属于控制面状态，不是 handler 能力。

**本插件的 worktree 路由策略**（不是上游限制）：`worktree_ensure` 始终以 hello 宣告的 `worktreeBase` 为基目录（base 本身也合法），不把上一个 worktree 当基目录，没有活动工作目录，也不回退到父目录。

**控制面声明不是安全边界**：它只说明隧道当前没有执行入口，不证明数据面其它路径（提示词、工具桥、附件下载）安全。

### 5.4 结果包装

成功：

```json
{ "status": "succeeded", "result": { } }
```

失败：

```json
{ "status": "failed", "error": { "code": "MachineServer.Unavailable", "message": "…" } }
```

失败码：`MachineServer.Unavailable`（未实现/已删除的执行 handler、未知路径）、
`MachineServer.Refused`（worktree 越界或含符号链接）、`MachineServer.Timeout`（流超时）、
`MachineServer.Internal`（处理异常）。设备响应 HTTP status 固定为 200，业务失败只看 `status` 字段。

## 6. Public API 原生 SSE

```http
GET /api/v1/threads/{threadId}/stream?until=run
Authorization: Bearer capy_…
Accept: text/event-stream
```

事件：

| event | data |
|---|---|
| `status` | `{threadId,status}` |
| `assistant` | `{callId,text}`（增量或全文） |
| `tool_call` | `{callId,name,text}`（摘要；本插件忽略，不转 OpenAI 调用） |
| `transcript` | `{id,source,text,model?,callId?}` |
| `turn` | `{phase:"start"|"end",outcome?}` |
| `run` | `{phase:"start"|"end"}` |
| `heartbeat` | `{}` |
| `error` | `{code,message}` |
| `done` | `{}` |

规则：

- `assistant` 按 `callId` 累积；若帧是全文（以已累积文本为前缀）只转发新增部分。
- `tool_call` 只有 `callId/name/text` 摘要，不含参数或结果；不能转成 OpenAI `tool_calls`，
  工具调用只来自 §9.4 的文本 JSON 包。
- `transcript(source=assistant)` 是最终文本；用它校正。
- `turn outcome=dropped` 不改变事件流：已发出的 preview 不回撤，但 `committed=false`，
  只能当普通文本，不能作为调用依据；最终文本仍以 transcript 校正。
- `error.code=region_unsupported` → 403。
- `run end` / `done` 完成；无 delta 也不轮询 outline，改为 `jamFailure` 明确错误（轮询 fallback 未实现）。

## 7. Files（附件）

```http
POST /api/v1/files
{ "files": [{ "name": "red.png", "mediaType": "image/png", "sizeBytes": 785 }] }
→ { "targets": [{ "fileId": "file_…", "url": "https://…", "expiresAt": "…" }] }
```

```http
PUT <presigned url>
Content-Type: image/png
Content-Length: 785
（不带 Authorization）
```

建线程时：

```json
"files": [{ "fileId": "file_…", "name": "red.png", "mediaType": "image/png", "sizeBytes": 785 }]
```

限制（来自公开 OpenAPI `UploadFilesRequest`）：`sizeBytes` 取值 1–262,144,000
（单文件 250 MB）；`files` 至少 1 个，**没有** API 级数量/总大小上限。
本机/内网 URL 由插件做 SSRF 拒绝。

## 8. Usage

```http
GET /api/v1/usage
GET /api/v1/usage/balance
```

- `remainingDollars: null` + `unlimited:false` → 无余额。
- 额度卡片：余额 / Token / 无头设备；不显示本期消费。
- 每条 window 必须有有限 `used`。

## 9. 对外 OpenAI API

### 9.1 `/chat/completions`

请求：标准 OpenAI Chat Completions（`messages`, `model`, `stream`, `reasoning_effort`）。

流式 chunk：

```json
data: {"id":"chatcmpl-…","object":"chat.completion.chunk","created":…,"model":"…",
"choices":[{"index":0,"delta":{"content":"pong"},"finish_reason":null}]}
```

结束：

```json
data: {"…":"…","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

非流式：

```json
{
  "id": "chatcmpl-…",
  "object": "chat.completion",
  "model": "…",
  "choices": [{ "index": 0, "message": { "role": "assistant", "content": "pong" }, "finish_reason": "stop" }],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

### 9.2 `/models`

```json
{ "object": "list", "data": [{ "id": "particle/particle-1", "object": "model", "owned_by": "capy" }] }
```

### 9.3 错误

```json
{ "error": { "message": "…", "type": "upstream_error", "code": "…", "status": 503 } }
```

### 9.4 客户端工具（方案 B + 文本桥）

请求可带 `tools` 与 `tool_choice`；工具名必须唯一，`tool_choice:"required"` 至少声明一个工具，
指定工具必须是已声明的 function 名。工具名重复、无效 `tool_choice`、指定未声明工具 →
400 `invalid_request`，在进入数据面前拒绝。规则：

- 每个请求独立白名单：只接受该请求声明的 function 名，并严格校验 `tool_choice`；带工具请求不复用线程。
- 文本桥解析优先级：
  1. `<TOOL_CALL>{"name":"<declared>","arguments":{...}}</TOOL_CALL>`（支持多参数工具）。
  2. 整段 JSON 包 `{"tool_calls":[{"name":"<declared>","arguments":{...}}]}`（允许外层代码围栏）。
  3. `<CMD tool="...">...</CMD>` / `<CMD>...</CMD>`（跳过行内反引号示例与占位符，为含 `description` 的 shell 工具自动补全摘要）。
- 方案 B（Machine RPC 拦截与即时短路）：当线程启用工具时，`ChatUseCase` 按 `jamId` 订阅 `bash/read/write/edit` 等隧道 RPC，剥离 `__capy_co_author` 初始化头与外层 shell 包装，按 schema 与 `tool_choice` 映射为多参数 OpenAI `tool_calls` 后立即短路 SSE 并 best-effort 中断上游 jam；`bridgeResponse` 兜底排空同一 `jamId` 缓冲。
- 任一项文本包非法（未声明工具、多余字段、参数非对象、空数组）→ 整包拒绝，不做部分采纳。
- 只有 Capy 已提交的 assistant transcript（`committed:true`）或方案 B 截获调用才允许产出 `tool_calls`；实时预览绝不转成 `tool_calls`。
- `tool_choice:"auto"` 且既无文本调用也无合法 RPC 截获 → 按普通文本返回 `finish_reason:"stop"`。
- `tool_choice:"required"` 或指定工具未满足 → 502 `upstream_error`。
- `tool_choice:"none"` → 不注入工具说明、不解析调用包、不做方案 B 短路（普通文本）。
- 调用 ID 由插件生成（`call_<ULID>`）；下一回合客户端以 `tool_call_id` 回传，插件把同一 ID
  （仅去除首尾空白）、工具名和原始 `arguments` 写进纯文本 prompt 的 `<tool_call>` 块，并把客户端
  `role:"tool"` 结果以同一 ID 绑定为 `<tool_result id=… name=…>`。ID 不是原生协议字段。
  请求历史里缺 ID 的调用整条跳过，不补造。
- 结果只能来自客户端 `role:"tool"` 消息；模型自带的“结果”会让包非法。

非流式响应：

```json
{
  "id": "chatcmpl-…",
  "object": "chat.completion",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "id": "call_…",
        "type": "function",
        "function": { "name": "…", "arguments": "{\"…\":…}" }
      }]
    },
    "finish_reason": "tool_calls"
  }],
  "usage": { "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0 }
}
```

流式：先发 `delta.role=assistant`，再发 `delta.tool_calls[]`，最后 `finish_reason:"tool_calls"` + `[DONE]`。

## 10. 错误映射

| 上游 | 对外 |
|---|---|
| 400 / `capy/InvalidRequest` | 400 `invalid_request` |
| 400 / `ModelSelection.Rejected` | 404 `model_not_found` |
| 401 / `capy/Unauthorized` | 401 `sign_in_required` |
| 402 / `capy/PaidFeatureUnavailable` | 402 `insufficient_quota` |
| 403 / `region_unsupported` | 403 `region_unsupported` |
| 403 / `capy/Forbidden` | 403 `upstream_error` |
| 429 / `capy/RateLimited` | 429 `rate_limited` |
| 5xx / 网络 | 503 `upstream_unavailable` |
| 超时 | 504 `upstream_timeout` |
| 设备配对失败 | 403 `device_pair_failed` |
| `tool_choice` required/指定工具未满足 | 502 `upstream_error` |
| 工具桥关闭但请求 required/指定工具 | 400 `invalid_request` |

## 11. 测试约定

- `test/unit/**`：纯函数/use case + fake ports，离线运行。
- `bun run smoke`：真实 Capy，本机登录态 → `/models` → `particle-1` `pong`。
- 真实 token 不进入测试、文档或日志；错误 message 也要 redact。
