# SPEC — magpie-Capy

> 状态：v1.0 / V0 可用
> 范围：Magpie 的 `capy` provider 插件

## 1. 项目定位

把 Capy（capy.ai）作为 Magpie 的一个 provider 接进来：

- **登录**：浏览器登录 / 从本机 Capy 客户端导入登录态（只读，不要求 Capy 运行）
- **运行时**：自动注册并维护一台以主机名命名的无头设备（如 `baijiu`），走 Capy device tunnel；
  该隧道只承担控制面（worktree / volume / 空 git capture），不提供 shell、文件读写/编辑或子进程执行
- **对话**：OpenAI 兼容 `/chat/completions`，原生 SSE，边生成边转发
- **模型**：64 个目录条目，3 个免费模型
- **附件**：图片/文件走 Capy 官方文件通道
- **额度**：余额 / Token / 无头设备状态

**这个仓库是后端插件，不是完整 Magpie 主机。** 前端（Magpie UI / 第三方 OpenAI 客户端）只通过
公开契约访问本插件，不接触 Capy 的 Clerk token、`capyd_` token 或 device tunnel。

## 2. 目标 / 非目标

### 目标

1. **干净的分层**：domain 不依赖网络，application 不依赖 Magpie/Capy SDK，adapters 可替换。
2. **契约先行**：所有外部协议、错误、流事件先写进 `CONTRACTS.md` 与测试，再实现。
3. **原生流式**：不轮询、不攒完整答案；首个 assistant 帧立即转成 OpenAI chunk
   （客户端工具请求除外：方案 C 需要完整调用包）。
4. **无头运行**：不要求 Capy 桌面端启动；设备由 device code 自动注册。
5. **为并行 Agent 开发设计**：工作包边界、冻结接口、契约测试、可独立验证。
6. **为未来模型设计**：模型能力、工具桥、路由策略都是可替换的策略对象，不写死在流程里。

### 非目标

- 生产隧道只承担控制面：`worktree_ensure` / `worktree_list`、`volume_landed` / `volume_probe`、
  空 `git capture`；`bash` / `bash_output` / `read` / `write` / `edit` / `file_*` 等执行 handler
  明确拒绝（`MachineServer.Unavailable`）；浏览器/computer/Drive 全量 RPC 未实现。
- 不实现原生 OpenAI tools（Capy 没有该通道；只有方案 C 的客户端工具桥，见 FR-10）。
- 不实现 `temperature` / `top_p` / `max_tokens` / `stop` / `response_format`（Capy 无对应字段）。
- 不提供浏览器 UI；UI 属于 Magpie 主机。
- 不引入数据库、消息队列、微服务。插件是**无状态请求处理器 + 极小的密钥状态**。
- 不伪造广告曝光、不绕过 Capy 的地区/套餐门禁。

## 3. 术语

| 术语 | 含义 |
|---|---|
| Host | Magpie 主机；调用插件钩子、提供 `fetch`/代理/日志/账号存储 |
| Control plane | 登录、账号、设备配对、模型目录、额度 |
| Data plane | `/chat/completions` 的请求/流式响应 |
| AccountSession | 一个 Capy 账号的不可变会话视图（API key、Clerk 会话、orgId、clientId） |
| Headless device | 插件自己维护的主机名设备（如 `baijiu`）；不是 Capy 桌面端 |
| Device tunnel | `wss://device-tunnel-production.cloud.capy.ai/tunnel` |
| Machine RPC | 服务端通过 tunnel 发给设备的 HTTP-over-WS 请求；本插件只接受控制面 handler（worktree / volume / 空 git capture） |
| Capy App API | `https://api.capy.ai/app/*`，Clerk `azp` JWT |
| Capy Public API | `https://api.capy.ai/api/v1/*`，组织级 `capy_…` key |

## 4. 角色与场景

### 4.1 首次使用（本机已有 Capy 登录）

1. `magpie plugin login capy 1` → 读本机登录态，换 Clerk 会话 + API key。
2. 首次对话 → 插件自动设备码配对 → `baijiu` 上线。
3. 对话 → 原生 SSE。

### 4.2 首次使用（只用浏览器）

1. `magpie plugin login capy 2` → 打开 `https://capy.ai/sign-in`。
2. Google / GitHub / Passkey / 邮箱任选。
3. 后续同上。

### 4.3 日常对话

- 客户端发 OpenAI `/chat/completions`。
- 插件确保无头设备在线（必要时重连/重配对）。
- 建设备线程 → 跟公共 SSE → 转 OpenAI chunk。
- 客户端断开 → 中断 Capy 线程。

### 4.4 失败场景

- 登录失效 → 401 `sign_in_required`，宿主提示重新登录。
- 无头设备注册失败 → 503，明确原因。
- 免费广告模型地区不支持 → 403 `region_unsupported`。
- 线程 credits 不足 → 402。
- 控制面之外的 machine RPC（bash、文件、浏览器等）→ 设备返回 `MachineServer.Unavailable`，不阻塞文本回答。

## 5. 功能需求

### FR-1 登录

- **FR-1.1 本机导入**：只读 `%APPDATA%\Capy` 的 `session-credential.json`、`device-credentials.json`、`Local State`；
  DPAPI + AES-GCM 解出 Clerk client JWT；**不要求 Capy 进程运行**。
- **FR-1.2 浏览器登录**：临时 Chromium + CDP；读取 `__client` Cookie；支持 Google/GitHub/Passkey/邮箱。
- **FR-1.3 续期**：定期校验 API key；失效用保存的 Clerk 会话重签；会话失效 → 401。
- **FR-1.4 账号隔离**：所有缓存/状态按 account key 隔离；无跨账号共享。

### FR-2 无头设备

- **FR-2.1 自动配对**：`POST /app/devices/code` → auto approve → poll → `capyd_…`。
  设备名默认取主机名（如 `baijiu`），已有设备通过 `PATCH .../devices/{id}` 自动重命名。
- **FR-2.2 状态持久化**：device token 存用户目录。Windows 用 DPAPI；macOS/Linux 用 0600 权限文件。
  位置：`%LOCALAPPDATA%\magpie-capy` / `~/Library/Application Support/magpie-capy` /
  `${XDG_STATE_HOME:-~/.local/state}/magpie-capy`；`MAGPIE_CAPY_STATE_DIR` 可覆盖。
- **FR-2.3 连接**：`hello` → `session-config` → `workspaces-changed` → `ready`；ping/pong。
  登记上报 `{hostname, os, arch}`，`os` ∈ `win32 | darwin | linux`；宿主有 WebSocket 即可。
- **FR-2.4 断线**：同一 token 先重连 3 次；只有服务端明确拒绝 token 才重新配对，
  避免网络抖动在账号里堆积半成品设备。
- **FR-2.5 machine RPC（仅控制面）**：
  - 接受：`worktree_ensure` / `worktree_list`、`volume_landed` / `volume_probe`、
    `POST /v1/git/capture`（返回空 `repos`）。
  - 拒绝：`bash` / `bash_output`、`read` / `write` / `edit` / `file_read` / `file_write`、
    浏览器 / computer 及任何其它 handler → 返回“成功 + `isError:true`”的工具结果，
    内容是“未执行，请改为输出客户端 JSON 调用包”；未知路径同样拒绝。
    用工具结果而不是传输失败，是因为 agent 会重试传输故障，却会读带 `isError` 的结果文本。
    这只是诱导，不能保证上游一定服从（见 §12 边界）。
  - 隧道 handler 没有 activeRoot、不 spawn 子进程、不提供文件读写/编辑入口。handler 侧唯一的
    文件系统操作是 `worktree_ensure` 在 hello 宣告的 `worktreeBase` 下校验并创建目录
    （base 本身也合法；父目录、`worktreeBase` 之外的绝对路径/不同盘符、
    路径组件含符号链接才拒绝）；
    设备 token 的本地持久化属于控制面状态，不是 handler 能力。
  - worktree/volume 结果目前是控制面应答或常量占位：`worktree_list` 返回空 entries，
    volume 只回显 `mountPath` 并标 `current`，不做真实卷校验（见 `CONTRACTS.md` §5.3）。
  - 控制面白名单只缩小隧道攻击面，不等于数据面其它路径安全（见 FR-10 与 `CONTRACTS.md` §5.3）。
- **FR-2.6 不跨组织**：设备 org 必须与账号 org 一致；本地凭据 org 不匹配时丢弃并重新配对，
  不使用其它组织的设备。

### FR-3 模型目录

- **FR-3.1 动态目录**：`GET /api/v1/models`；失败时用静态快照。
- **FR-3.2 免费模型**：`particle/particle-1`、`zai/glm-5.3-flash-ads`、`deepseek/deepseek-v4.1-flash-ads` → `free:true`。
  后两个是 ADS 模型：建线程必须带 `ads-models` 能力位，且**出口 IP 仅限 US / CA / UK / AU / NZ / IE**；
  其它地区返回 403 `region_unsupported`（Capy 服务端判定，插件不能绕过）。
- **FR-3.3 免费优先排序**：免费模型排最前（宿主 `/v1/models` 截断时仍可见）。
- **FR-3.4 模型解析**：精确 id → `capy/` 前缀剥离 → 短名 → 展示名；未知 → 404。
- **FR-3.5 能力描述**：Capy `/models` **不返回** image/pdf/tool 能力。插件按通道能力标记：
  files 通道接受图片/PDF；`tools` 标记表示插件接受客户端工具声明并按方案 C 桥接，
  不是 Capy 原生工具能力。能力注册表保留 per-model override，不把这些标记冒充成 Capy 的模型元数据。

### FR-4 对话

- **FR-4.1 请求**：OpenAI `messages`；system/developer 单独成块；单条 user 原样发送。
- **FR-4.2 线程**：App API `POST /app/orgs/{org}/jams`，projectless + device + worktree。
- **FR-4.3 流**：公共 API `/api/v1/threads/{id}/stream?until=run`；assistant 帧实时转发；transcript 校正。
- **FR-4.4 流式输出**：OpenAI `chat.completion.chunk`；文本 `finish_reason:"stop"`；
  工具调用 `finish_reason:"tool_calls"`（见 FR-10）；`[DONE]`。
- **FR-4.5 非流式**：返回完整 `chat.completion`。
- **FR-4.6 取消**：客户端断开 → `POST /app/.../interrupt`。
- **FR-4.7 降级**：公共 SSE 失败 → 明确错误；不自动轮询 outline（未实现）。
- **FR-4.8 思考档位**：`reasoning_effort` → `model.reasoningMode`；不支持则丢弃。
- **FR-4.9 上下文预算**：不设本地字符上限。Capy 按 token 管理上下文
  （`GET /app/orgs/{org}/jams/{jam}/events/context-usage` →
  `budgetTokens` / `compactAtTokens` / `windowTokens`），超出阈值由服务端自动 compact。
  实测 particle-1：budget 400k token、window 1,048,576 token；255,743 字符 prompt 正常回答。

### FR-5 图片 / 附件

- **FR-5.1 提取**：`image_url` / `file` / `input_file`（data URL / 公网 URL / 裸 base64）。
- **FR-5.2 上传**：`POST /api/v1/files` → 预签名 PUT → jam `files[]`。
- **FR-5.3 限制**：公共 API 规定**单文件最大 250 MB**（`sizeBytes` 上限 262,144,000），
  文件数没有 API 级上限；不额外发明 8 个/60 MB 之类的本地限制。本机/内网 URL 拒绝（SSRF）。

### FR-6 额度

- **FR-6.1 余额**：`/usage/balance` → `余额` 窗口；无余额 `used:100` 让账号沉底。
- **FR-6.2 Token**：`/usage` → aside 展示。
- **FR-6.3 设备状态**：无头设备 `connected` → `已连接 · <hostname>`。
- **FR-6.4 不显示本期消费**。

### FR-7 错误

- 统一 `CapyError`：`status + code + message + retryable`。
- 401/402/403/404/429/5xx 映射见 `CONTRACTS.md`。
- 流已 200 后的错误：OpenAI error chunk + `[DONE]`。
- 不把 token/secret 写进 message 或日志。

### FR-8 代理

- 显式代理：`MAGPIE_CAPY_PROXY` → `HTTPS_PROXY`/`HTTP_PROXY`/`ALL_PROXY` → Windows 系统代理。
- Bun 用 `fetch({proxy})`；代理连接失败 → 本次直连（一次警告）。
- 地区限制按出口 IP，不靠请求头。

### FR-9 系统提示词

- `promptVariant:"minimal"` 默认尝试一次；403 自动降级并记住。
- 不注入插件自己的“OpenAI 兼容”提示。
- `MAGPIE_CAPY_PROMPT_VARIANT=default|minimal|auto`。

### FR-10 工具（方案 C：客户端执行，Provider 只翻译）

- Capy 没有原生 OpenAI tools 通道。上游 `tool_call` SSE 事件只有 `callId/name/text` 摘要，
  不含参数/结果；插件不把它转成 OpenAI `tool_calls`，也不在 Capy 侧执行任何客户端工具。
- 每个请求独立白名单：只接受该请求 `tools` 声明的 function 名；不保存跨请求状态。
  工具名重复、无效 `tool_choice`、指定未声明工具 → 400 `invalid_request`（进入数据面前拒绝）。
- 提示词要求模型只返回一个完整 JSON 对象（顶层仅 `tool_calls`；可整段套一层 ``` 或 ```json
  代码围栏，不从散文里抠），每项只有 `name` + `arguments`；
  任一项非法（未声明工具、多余字段、非对象参数、空数组）→ 整包拒绝，不部分采纳；
  `auto`/`required` 下一个包内可以有多项合法调用，但必须全部通过校验；指定工具时要求恰好 1 个调用。
- 只有 Capy 已提交的 assistant transcript 才允许解析；实时预览/未提交文本即使形如调用包也不转调用。
  若上游只有未提交预览，`auto` 按普通文本返回 `finish_reason:"stop"`，不回撤也不标记截断。
- `tool_choice:"auto"` 且没有合法包 → 按普通文本返回，不伪造调用。
- `tool_choice:"none"` → 不注入工具说明、不解析调用包（普通文本）。
- `tool_choice:"required"` 或指定工具未满足 → 明确失败（502 `upstream_error`）：
  已提交但无合法包、或根本没有提交 transcript，都返回明确 message；
  不返回空调用、不猜测参数。
- 调用 ID 由插件在返回时分配（`call_<ULID>`）；后续回合客户端以 `tool_call_id` 回传（仅去首尾空白），
  插件把同一 ID、工具名、原始参数写入纯文本 prompt 的 `<tool_call>` 块，并把客户端
  `role:"tool"` 结果以同一 ID 绑定为 `<tool_result>`。ID 不是原生协议字段。
  请求历史里缺 ID 的调用整条跳过，不补造。
- 结果只能来自客户端后续的 `role:"tool"` 消息；提示词和解析都不允许模型自带“结果”。
- 带工具请求（`tools` 非空且 `tool_choice` ≠ `"none"`）先收集完整文本再编码（调用包需要完整 JSON），
  该路径不逐 token 流式；首字节推迟到生成结束，首字节超时风险高于普通聊天。
- `toolsEnabled=false`：不注入工具说明、不解析调用包；此时 `tool_choice:"required"` / 指定工具
  → 400 `invalid_request`，不静默忽略。
- 提示词桥不是原生工具通道，也不是隔离机制；不能据此声称 Capy 能执行客户端工具。
  上游若未来提供原生 tools，才新增适配器（见 §11）；当前不存在 `NativeToolBridge`。

## 6. 对外 API

### 6.1 OpenAI 兼容

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/chat/completions` | 流式/非流式 |
| GET | `/models` | OpenAI list 形状 |

请求/响应/错误见 `CONTRACTS.md`。

### 6.2 控制面（内部）

控制面不直接暴露给 OpenAI 客户端；由 Host adapter 调用：

- login/refresh
- device ensure/pair
- catalog
- usage

## 7. 数据模型

```
AccountSession {
  accountId, uid, orgId, clientId,
  accessToken,            // capy_…
  clerk: { clientJwt, sessionId },
  source: "local" | "browser" | "refresh"
}

HeadlessCredential {
  orgId, deviceId, name, token // capyd_…（内存或 DPAPI/0600 凭据状态里）
}

ModelDescriptor {
  id, name, free,
  reasoningModes: string[],
  capabilities: { text, image, pdf, attachment, tools } // tools = 方案 C 客户端桥，非原生
}

ChatRequest / ChatEvent / UsageSnapshot / CapyError
```

**没有数据库。** 插件是请求作用域的；持久化只有：
- Host 的账号记录（API key + Clerk 会话）
- DPAPI 加密的 headless credential

如需缓存，使用 `CachePort` 的内存实现；不引入 DB。

## 8. 外部协议

详见 `CONTRACTS.md`：

- Clerk FAPI（`azp`）
- Capy App API（me/orgs/devices/api-keys/jams/devices code）
- Device tunnel（hello/session-config/ready/ping）
- Machine RPC（open/data/close/response；本插件只接受控制面 handler）
- Public SSE（status/assistant/transcript/turn/run/error/done；`tool_call` 摘要不转 OpenAI 调用）
- Files（POST /files + presigned PUT + jam files）
- Usage

## 9. 非功能需求

### 性能

- 插件自身开销（在拿到上游帧之后）< 20ms/帧。
- 不轮询；SSE 首帧立即转发（客户端工具请求需等完整调用包，见 FR-10）。
- 设备 ensure 缓存：同一账号同一进程只做一次；断线才重连。
- 附件上传与线程创建可并行（除依赖顺序外）。
- 大 prompt 不设本地字符上限，交给 Capy 的 token budget/compact；附件用 API 的
  250 MB/文件限制，超限/非法才 400。

### 可靠性

- 上游 5xx/超时 → 可重试错误；客户端断开 → interrupt。
- 设备重连最多一次重配对。
- SSE 断线：有 `sawDelta` 不重试；无 delta 也不轮询 outline，由 `jamFailure` 返回明确错误（未实现轮询 fallback）。
- 所有网络调用有超时与 AbortSignal。

### 安全

- Secret 只在内存或 DPAPI/0600 凭据状态；日志 redaction。
- 不读非必要的本机文件；本机导入只读指定文件。
- 设备隧道只保留控制面 handler，拒绝 shell/文件读写执行；这只是缩小攻击面，
  不构成数据面其它路径（提示词、工具桥、附件下载）的安全保证。
- 公网 URL 下载做 SSRF 防护（私网/本机拒绝）。
- OAuth/登录窗口使用临时 profile，不碰用户日常浏览器配置。

### 可观测性

- 结构化事件：`login`, `device.pair`, `device.ready`, `chat.start`, `chat.first_delta`, `chat.done`, `upstream.error`。
- 事件字段不含 secret；token 只出现长度/前缀。
- 可选 metrics 端口；默认只日志。

## 10. 前端 / 后端边界

- **Frontend contract**：OpenAI 兼容 API。第三方客户端/Magpie UI 只依赖它。
- **Backend**：本插件。Capy 的认证、设备、协议细节全部封装在 adapters。
- **Control plane / Data plane**：同一进程，不同模块；控制面不进入流式热路径。
- **未来 UI**：如建控制台，只调用控制面 API；不直接持有 Capy secret。

## 11. 未来模型与能力演进

- `ModelDescriptor` + `CapabilityRegistry`：模型能力数据驱动。
- `ModelPolicy`：free-first、能力 override、上下文预算；按需扩展。
- `ToolBridge`：当前只有 `PromptToolBridge`（方案 C，客户端执行）；Capy 没有原生 tools 通道，
  因此不存在可用的 `NativeToolBridge`。上游未来若提供，才新增适配器，不改 application。
- `StreamNormalizer`：把不同上游事件（SSE/NDJSON）归一成 `ChatEvent`。
- 协议版本：`contractVersion` 校验；未知帧忽略；新能力通过 capability 探测。
- 不假设模型数量、名称、上下文窗口；目录动态 + 静态兜底。

## 12. 验收标准

一个垂直切片算完成，当且仅当：

1. `bun test` 全绿（unit + contract）。
2. `bun run build` 产出可被 Magpie 加载的 `dist/index.mjs`。
3. 离线契约测试覆盖：登录、设备配对、建线程、SSE 帧、OpenAI chunk、错误映射、
   控制面 handler 拒绝、工具包解析与 `tool_choice` 失败。
4. 真机 smoke（环境变量开启）：
   - 本机导入/浏览器登录
   - 无头设备 `connected:true`
   - `particle-1` 返回 `pong`
   - 无 Capy 进程
5. 日志无 secret。
6. `SPEC` / `CONTRACTS` / 代码行为一致。

## 13. 发布与迁移

- provider id：`capy`；`MAGPIE_CAPY_PROVIDER_ID` 仅用于测试覆盖。
- 同一 Magpie 只安装一份 `capy` 插件。
- 旧账号记录可直接复用：`access` 是 API key，`refresh` 是 Clerk 会话 JSON。
- 设备 token 在 `%LOCALAPPDATA%\magpie-capy`（Windows）或用户目录（macOS/Linux）。
- 发布前跑：`bun test && bun run typecheck && bun run build && bun run smoke`。
