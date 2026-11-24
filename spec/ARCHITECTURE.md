# ARCHITECTURE — magpie-Capy

## 1. 设计原则

1. **依赖只向内**：`domain ← application ← ports ← adapters ← entry`。
   domain/application 不知道 HTTP、WebSocket、Magpie、Bun、DPAPI。
2. **控制面 / 数据面分离**：登录/设备/目录/额度是控制面；`/chat/completions` 是数据面。
   设备隧道只承担控制面（worktree / volume / 空 git capture），不承载 shell、文件读写/编辑或子进程执行。
   数据面热路径不碰控制面的全局锁/缓存。
3. **端口与适配器**：Capy App API、Public API、Device Tunnel、Machine RPC、Host、SecretStore
   都是 port；每类实现可替换、可 fake。
4. **纯函数核心**：协议解析、消息拍平、错误映射、模型排序都是纯函数；副作用在 adapter。
5. **事件流优先**：上游 SSE/NDJSON → `ChatEvent` 异步迭代器 → OpenAI SSE encoder。
   测试直接消费事件，不解析字符串。
6. **无全局单例**：`createApp(deps)` 显式注入 clock/ids/fetch/logger/secretStore。
7. **契约先行**：先写协议契约与失败测试，再写 adapter。
8. **为并行 Agent 设计**：工作包只依赖冻结的 port/type；接口变更走 ADR。

## 2. 模块图

```
┌────────────────────────────────────────────────────────────────┐
│ entry/host (Magpie plugin hooks)                               │
│  config · auth.methods · auth.loader · auth.usage · provider   │
└───────────────┬────────────────────────────────────────────────┘
                │ calls use cases / OpenAI encoder
┌───────────────▼────────────────────────────────────────────────┐
│ application                                                     │
│  LoginUseCase · DeviceUseCase · CatalogUseCase · ChatUseCase    │
│  UsageUseCase · ToolBridge · AttachmentCollector · Normalizer   │
└───────┬───────────────────┬───────────────────┬────────────────┘
        │ ports             │ ports             │ ports
┌───────▼─────────┐ ┌───────▼─────────┐ ┌───────▼────────────────┐
│ CapyAppPort     │ │ CapyPublicPort  │ │ DeviceRuntimePort      │
│ Clerk/App API   │ │ threads/SSE/files│ │ tunnel (control) + RPC │
└───────┬─────────┘ └───────┬─────────┘ └───────┬────────────────┘
        │ adapters          │ adapters          │ adapters
┌───────▼─────────┐ ┌───────▼─────────┐ ┌───────▼────────────────┐
│ capy/app-client │ │ capy/public-... │ │ capy/device-tunnel     │
│ clerk-client    │ │ sse-parser      │ │ machine-rpc            │
└─────────────────┘ └─────────────────┘ └────────────────────────┘

domain: AccountSession, ModelDescriptor, ChatRequest/Event, CapyError, Usage
platform: fetch/proxy, DPAPI, ULID, clock, logger, redaction
protocol: SSE / OpenAI wire codecs (no business logic)
```

## 3. 目录布局

```
src/
  entry/
    plugin.ts              # Magpie hooks 装配（唯一知道 Magpie hook 形状的地方）
  application/
    attachments.ts         # OpenAI content parts → Capy files
    catalog.ts             # live /models + 静态兜底
    chat.ts                # jam → SSE → ChatEvent
    device.ts              # 每账号 single-flight
    login.ts               # Clerk → org → API key
    stream.ts              # Public SSE 归一
    tools.ts               # 客户端工具桥（方案 C）
    usage.ts               # balance/token 窗口
  domain/
    account.ts
    chat.ts
    errors.ts
    model.ts
    usage.ts
  ports/
    capy-app.ts
    capy-public.ts
    device-runtime.ts
    login.ts
    platform.ts
    tool-bridge.ts
  adapters/
    capy/
      app-client.ts
      browser-login.ts
      clerk-client.ts
      device-tunnel.ts
      endpoints.ts
      local-login.ts
      public-client.ts
      static-catalog.ts
    host/
      magpie-auth.ts
    platform/
      console-logger.ts
      dpapi.ts
      http.ts
      memory-cache.ts
      proxy-fetch.ts
      system-clock.ts
      ulid.ts
  protocol/
    openai.ts
    sse.ts
  observability/
    redact.ts
spec/
  SPEC.md
  ARCHITECTURE.md
  CONTRACTS.md
  DECISIONS.md
  AUDIT.md
  adr/
test/
  unit/
scripts/
  smoke.mjs
```

**entry 是唯一允许知道 Magpie hook 形状的地方。** 其他层不得反向依赖。
**entry 是唯一允许 import `@magpie` 的地方。** 其他层不得反向依赖。

## 4. 关键流程

### 4.1 登录（控制面）

```
Host auth.methods.authorize
  → LoginUseCase.local()/browser()
      → LocalCredentialReader / BrowserLogin (adapters)
      → ClerkClient.sessionJwt(azp)
      → CapyAppClient.me/orgs/apiKeys
  → AccountSession
  → Host saves access/refresh
```

- `AccountSession` 是不可变值；不存全局变量。
- 登录不触发设备配对（配对在首次 device ensure）。

### 4.2 无头设备（控制面）

```
DeviceUseCase.ensure(session)
  → SecretStore.load(accountKey)     # DPAPI
  → if none/expired:
       CapyAppClient.startDeviceCode()
       CapyAppClient.approveDeviceCode()
       CapyAppClient.pollDeviceCode() → HeadlessCredential
       SecretStore.save()
  → DeviceTunnel.connect(credential)
       hello → session-config → workspaces-changed → ready
  → CapyAppClient.listDevices() until connected
```

- 每账号一个 `DeviceRuntime`；进程内复用。
- 连接失败 → 关闭 → 重新配对一次。
- 设备 org 必须匹配账号 org；本地凭据 org 不匹配时丢弃并重新配对，不复用其它组织的设备。
- 隧道只接受控制面 handler：`worktree_ensure` / `worktree_list`、`volume_landed` /
  `volume_probe`、空 `git capture`；bash/文件/浏览器等一律 `MachineServer.Unavailable`。
- 隧道 handler 没有 activeRoot、不 spawn 子进程；handler 侧唯一的文件系统操作是
  `worktree_ensure` 在 `worktreeBase` 下创建目录并做符号链接校验。设备 token 持久化属于
  控制面状态，不是 handler 能力。

### 4.3 对话（数据面）

```
Host loader /chat/completions
  → OpenAIParser.parse(body)
  → AttachmentResolver.collect() → files (optional)
  → DeviceUseCase.ensure(session)       # cached
  → ChatUseCase.run()
       CapyAppClient.createJam(device, prompt, model, files)
       CapyPublicClient.stream(threadId)
         → StreamNormalizer → ChatEvent*
       onDelta → OpenAISseEncoder
  → Response(SSE)
```

- `ChatUseCase` 不直接拼 OpenAI 字符串；它产出 `ChatEvent`。
- `OpenAISseEncoder` 是唯一知道 `data:` / `[DONE]` 的模块。
- 取消：`AbortSignal` → `ChatUseCase.cancel()` → `interrupt`。

### 4.4 客户端工具（方案 C）

```
Host /chat/completions（tools + tool_choice）
  → OpenAIParser.parse：校验工具名唯一、tool_choice 合法
  → ChatUseCase：PromptToolBridge.instruction(tools, choice) 注入 prompt
  → Capy 线程 → 公共 SSE → collectReply（记录是否 committed）
  → 仅 committed transcript 可进入 PromptToolBridge.parse(text, tools, choice)
       合法完整包 → 分配 call_<ULID> → OpenAI tool_calls
       非法/缺失 + auto → 普通文本
       非法/缺失/未提交 + required/指定工具 → 502 upstream_error
  → 客户端执行
  → 下一回合 role:"tool" + tool_call_id → prompt 的 <tool_result id=… name=…> 块
```

- 每个请求独立白名单：`PromptToolBridge` 无可变状态，只认该请求 `tools` 的 function 名。
- 只接受一个完整 JSON 对象包（顶层仅 `tool_calls`，每项仅 `name` + `arguments`）；
  `auto`/`required` 下可含多项合法调用，指定工具时要求恰好 1 个调用；
  可整段套一层 ``` 或 ```json 代码围栏（解析容忍，不是提示词要求）；
  任一项非法或正文夹带内容则整包拒绝，不做部分采纳。
- 只有 Capy 已提交的 assistant transcript 才允许转成调用；实时预览、未提交文本不转调用；
  仅预览时按普通文本返回 `finish_reason:"stop"`，不回撤也不标记截断。
- 调用 ID 由 provider 生成；客户端后续以 `tool_call_id` 回传（插件仅去除首尾空白），
  插件把同一 ID、工具名、原始参数写入纯文本 `<tool_call>` 块，并把客户端结果以同一 ID
  绑定为 `<tool_result>`；这是纯文本约定，不是原生字段。请求历史里缺 ID 的调用整条跳过，不补造。
- 结果只能来自客户端；模型自带的“结果”会让包非法。
- required/指定工具未满足时区分“已提交但无合法包”和“未提交 transcript”两种明确失败。
- 带工具请求先收完整文本再编码，该路径不逐 token 流式。
- 提示词桥不是原生工具通道，也不是隔离机制。控制面白名单（§4.2）只说明隧道没有执行入口，
  不能据此声称数据面其它路径安全。

## 5. 并发与状态

| 状态 | 位置 | 生命周期 |
|---|---|---|
| AccountSession | Host auth record | 持久 |
| HeadlessCredential | SecretStore（DPAPI） | 持久 |
| DeviceRuntime | 进程内 Map<accountKey, runtime> | 进程 |
| Catalog cache | 进程内 TTL Map | 进程 |
| Attachment fileId cache | 进程内 TTL Map | 进程 |
| 请求上下文 | 每个调用 | 请求 |

- 不共享可变全局；缓存按 accountKey。
- `DeviceUseCase.ensure` 用 **single-flight**（同账号并发只连接一次）。
- 不同账号完全隔离。
- 不引入数据库/队列。
- 隧道 handler 不保存 activeRoot，也不持有子进程/文件句柄；handler 的磁盘副作用只有 worktree 目录；
  设备 token 持久化属于控制面状态。

## 6. 错误模型

```ts
type ErrorKind =
  | "invalid_request" | "not_found" | "model_not_found" | "sign_in_required"
  | "insufficient_quota" | "region_unsupported" | "device_pair_failed"
  | "rate_limited" | "upstream_unavailable" | "upstream_timeout"
  | "upstream_error" | "internal_error" | "not_implemented";

class CapyError extends Error {
  kind: ErrorKind;
  status: number;
  retryable: boolean;
  detail?: string;
}
```

- domain 抛 `CapyError`；adapter 只做映射。
- 流已 200 后：`OpenAISseEncoder.error()` + `[DONE]`。
- 不把上游 message 原样拼进日志（先 redact）。

## 7. 流式设计

```
Upstream SSE frame → protocol/sse parse → StreamNormalizer
  → ChatEvent { type: "delta" | "final" | "error" | "done" }
  → ChatUseCase (accumulate/correct)
  → entry/openai encode
```

- `ChatEvent` 是纯数据；可快照测试。
- `assistant` 帧：按 `callId` 累积；重复全文用前缀去重。
- `transcript(source=assistant)`：最终文本校正。
- `turn(dropped)`：不改事件流，也不回撤已发 preview；未提交文本只当普通文本，不作为调用依据。
- 无 delta 也不轮询 fallback；由 `jamFailure` 明确报错（轮询未实现）。

## 8. 模型能力与未来扩展

- `ModelDescriptor` 来自 catalog；`CapabilityRegistry` 把 descriptor → OpenAI capabilities。
- `ModelPolicy`：
  - `freeFirst()`
  - `contextBudget()`
  - 未来 `costAware()` / `latencyAware()`
- `ToolBridge`：
  - `PromptToolBridge`（当前）：方案 C，每请求白名单、完整单包、required 未满足明确失败
  - `NativeToolBridge`：不存在；Capy 没有原生 tools 通道，上游提供后才新增，不改 application
- `StreamNormalizer`：
  - `PublicSseNormalizer`
  - 未来 `AppNdjsonNormalizer`
- 新增模型/能力不改 application；只加数据或适配器。

## 9. 为并行 Agent 开发设计

1. **冻结接口**：`ports/*.ts` 先评审；agent 不改 port，只实现 adapter/use case。
2. **单一真相**：协议在 `CONTRACTS.md`，自定值在 `AUDIT.md`；不要靠猜测补协议。
3. **无共享可变状态**：模块之间只通过 port/值对象。
4. **小 PR**：一个改动只做一件事；不跨层“顺手重构”。
5. **主分支保护**：`bun test` + `bun run typecheck` + `bun run build` 必须绿。
6. **ADR**：改接口/协议/错误码先写 ADR，再改代码。

## 10. 构建与运行

- 源码 TypeScript（Bun 直接执行测试）。
- `bun build src/entry/plugin.ts --outfile dist/index.mjs --target bun --format esm`
- `package.json`：
  - `main: dist/index.mjs`
  - `type: module`
  - `magpie` 元数据
- provider id：`capy`（ADR-007）；`MAGPIE_CAPY_PROVIDER_ID` 可覆盖。
- 零运行时依赖（只用 Bun/Node/Web 标准库）。

## 11. 为什么没有数据库/前端

- 插件是**请求作用域**的 provider adapter：没有业务实体需要持久化。
- 账号/密钥归 Host；设备 token 归 DPAPI；其余是 TTL 缓存。
- 前端是 Magpie UI / 第三方 OpenAI 客户端；本仓库只提供 API 契约。
- 引入 DB/队列会让插件部署复杂化，不带来功能收益。

## 12. 观测与安全

- `LoggerPort` 结构化事件；默认 console，可替换。
- `redact()`：token、cookie、authorization、capyd_、capy_ 全部打码。
- 设备隧道只接受控制面 handler；这是缩小攻击面的实现策略，不代表数据面
  （prompt、工具桥、附件下载）天然安全。
- 计时：`chat.first_delta_ms`、`device.ensure_ms`、`upstream.ttfb_ms`。
- 不在日志里输出完整 prompt/附件内容。

## 13. 演进路线

1. **垂直切片**：local login → device pairing → text chat → usage。
2. **附件**：image_url/data URL → files。
3. **浏览器登录**：CDP + Clerk。
4. **客户端工具桥**：PromptToolBridge（方案 C）。
5. **增强**：模型策略、重试、指标、控制面 API。
6. **未来**：App NDJSON、真实 worktree/volume 语义、更多控制面 machine RPC；
   NativeToolBridge 只在 Capy 提供原生通道后才成立，不做 shell/文件读写执行面。
