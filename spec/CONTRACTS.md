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

### 5.3 已实现 handler

| handler | params | result |
|---|---|---|
| `bash` | `{command, timeoutSeconds, ...}` | `{kind:"bash", stdout, stderr, exitCode, durationMs, timedOut, isError}` |
| `bash_output` | `{operationId}` | `{kind:"not-running"}` |
| `read` | `{path, offset?, limit?, maxChars?}` | `{kind:"read", content, offset, totalLines, isError:false}` |
| `write` | `{path, content}` | `{kind:"write", path, bytes, isError:false}` |
| `edit` | `{path, oldString, newString, replaceAll?}` | `{kind:"edit", path, replacements, isError:false}` |
| `file_read` | `{path}` | `{kind:"read"|"missing", ...}` |
| `file_write` | `{path, content, baseSha?}` | `{kind:"written"|"conflict", ...}` |
| `worktree_ensure` | `{root, checkouts?, startFromOrigin?}` | `{root, created, checkouts: []}` |
| `worktree_list` | `{roots?, activeRoots?, dirty?}` | `{kind:"worktree_list", entries: []}` |
| `volume_landed` | `{mounts:[{mountPath,digest}]}` | `{kind:"volume_landed", mounts:[{mountPath,current:true}], landing:false, checkpoints:false, directories:[], unretained:[], handback:true}` |
| `volume_probe` | `{mounts:[…]}` | `{mounts:[{mountPath,state:"current"}]}` |
| `POST /v1/git/capture` | `{repos:[],baseRefs:["origin/HEAD"]}` | `{repos:[]}` |
| 浏览器/computer 等 | — | `{status:"failed", error:{code:"MachineServer.Unavailable", message:"…"}}` |

### 5.4 结果包装

成功：

```json
{ "status": "succeeded", "result": { } }
```

失败：

```json
{ "status": "failed", "error": { "code": "MachineServer.Unavailable", "message": "…" } }
```

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
| `transcript` | `{id,source,text,model?,callId?}` |
| `turn` | `{phase:"start"|"end",outcome?}` |
| `run` | `{phase:"start"|"end"}` |
| `heartbeat` | `{}` |
| `error` | `{code,message}` |
| `done` | `{}` |

规则：

- `assistant` 按 `callId` 累积；若帧是全文（以已累积文本为前缀）只转发新增部分。
- `transcript(source=assistant)` 是最终文本；用它校正。
- `turn outcome=dropped` 丢弃 live 片段。
- `error.code=region_unsupported` → 403。
- `run end` / `done` 完成；无 delta 才允许轮询 fallback。

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

## 11. 测试约定

- `test/unit/**`：纯函数/use case + fake ports，离线运行。
- `bun run smoke`：真实 Capy，本机登录态 → `/models` → `particle-1` `pong`。
- 真实 token 不进入测试、文档或日志；错误 message 也要 redact。
