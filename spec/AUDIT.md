# AUDIT — 自定值、兜底与未使用代码

> 审计对象：`magpie-Capy`。
> 结论只认证据：公开 OpenAPI、Capy 真实 API 响应、Capy 0.9.2 bundle、以及本机真实请求。

## 0. 一句话结论

之前两个“上游限制”都是我们自己编的：

| 被当成上游事实 | 实际 | 处理 |
|---|---|---|
| prompt 上限 160,000 字符 | Capy 没有这个限制；真实是 token budget：particle-1 `budgetTokens=400000`、`windowTokens=1048576`、自动 compact | 删除，长 prompt 原样透传 |
| 附件 20 MB / 一次 8 个 / 总计 60 MB | 公开 OpenAPI：单文件 **250 MB**（`sizeBytes ≤ 262,144,000`），没有数量/总量上限 | spec 改为 250 MB/文件，不再额外限制 |

除此之外，代码里还有一些**插件策略**（可以保留，但不能再冒充上游事实）、**静默兜底**（已删/需删）和**未接线代码**（必须列清楚）。

---

## 1. 已核实为上游事实（保留）

| 值/行为 | 证据 |
|---|---|
| `https://api.capy.ai/app` / `/api/v1` / Clerk FAPI / device tunnel | `CONTRACTS.md` + 实测 |
| 公共目录 62 个模型，id/name/reasoningModes 与静态快照 **0 diff** | 2026-11-20 `GET /api/v1/models` 对比 `src/adapters/capy/static-catalog.ts` |
| 3 个免费模型 | 定价页 + `/models.default.skipped[].reason` 明确写 “Particle-1, which is free with no ads” |
| `reasoningMode` 枚举 `none/instant/minimal/low/medium/high/xhigh/max` | 公开 OpenAPI `ModelSelection`；与 `/models` 的 `reasoningModes` 完全一致 |
| `/models` 返回 `default: {modelId, source, skipped[]}` | 实测响应；`source` 枚举 personal/service_user/slack/linear/org/platform |
| 建线程省略 `model` 时 Capy 走默认链，并在 `modelDefault` 报告 | 公开 OpenAPI `CreateThreadRequest.model` 描述 |
| 上下文：`budgetTokens=400000`、`compactAtTokens=400000`、`windowTokens=1048576` | `GET /app/orgs/{org}/jams/{jam}/events/context-usage`（particle-1） |
| 255,743 字符 prompt 端到端正常回答 | 真实 jam `jam_01M7TJX5K1G1V8YREJ0JV1JSCZ`，14.4s，返回 `pong` |
| 附件单文件上限 250 MB，无数量/总量上限 | 公开 OpenAPI `UploadFilesRequest.files.items.sizeBytes.maximum=262144000`；`files` 仅要求 ≥1 |
| `/app/me` 的偏好组织在 `preferences.preferredOrgId` | 实测响应；不是顶层 `preferredOrgId` |
| `/app/organizations` 返回组织数组（含 `defaultModel`） | 实测响应 |
| `usage` / `usage/balance` 字段 | 实测响应；`remainingDollars:null` + `unlimited:false` = 无余额 |
| device `os` = `win32/darwin/linux`，`arch` 只有 arm64/x86_64 | Capy 0.9.2 main bundle `PEe` |
| device tunnel `contractVersion:2`、hello/session-config/ready、machine RPC | `CONTRACTS.md` + 实测 |
| Clerk JWT 60s | `CONTRACTS.md` + 实测 |

---

## 2. 插件策略（不是上游事实，保留但标注）

这些值必须保留（宿主/实现需要），但不能再写成“Capy 规定”：

| 值 | 位置 | 性质 |
|---|---|---|
| `capy` provider id | `src/entry/plugin.ts` | 直接替代旧插件；`MAGPIE_CAPY_PROVIDER_ID` 可覆盖 |
| 设备名 = `os.hostname()`（如 `baijiu`） | 设备配对 | 插件策略；`MAGPIE_CAPY_DEVICE_NAME` 可覆盖 |
| `magpie-plugin` API key 名 | `src/application/login.ts` | 服务端只存 hint，同名可重复创建 |
| `JWT_TTL_MS = 50_000` | `src/application/chat.ts` | Clerk JWT 60s 的安全余量 |
| catalog cache 10 分钟 | `src/application/catalog.ts` | 插件缓存策略 |
| usage cache 60 秒 | `src/application/usage.ts` | 插件缓存策略 |
| `freeFirst` 排序 | `src/domain/model.ts` | Magpie 展示策略；不再写死“前 24 个” |
| 无余额 `used=100` | `src/application/usage.ts` | Magpie 路由策略，让账号沉底 |
| 设备卡 `used=0/100`、`aside:true` | `src/application/usage.ts` | Magpie 展示策略 |
| `temperature:false` | `src/entry/plugin.ts` | Capy `ModelSelection` 没有 temperature，属于协议事实 |
| 所有模型 `image/pdf/attachment=true` | `src/domain/model.ts` | Capy files 通道接受图片/PDF；模型是否“看懂”由模型决定；不是 `/models` 字段 |
| `toolcall=true` | `src/domain/model.ts` | 不是原生 tools；表示方案 C 客户端工具桥可用（由 `toolsEnabled` 决定） |
| 非流式 `usage` 全 0 | `src/protocol/openai.ts` | 占位；Capy 公共 SSE 不给 token 计数 |
| `PromptToolBridge` | `src/application/tools.ts` | 方案 C：每请求白名单、只接受完整单包（可整段围栏、包内多调用）、只解析 committed transcript；不是原生通道 |
| 工具提示词声明设备无 shell/文件工具 | `src/application/tools.ts` | 与隧道拒绝一致；提示词不是隔离机制 |
| machine RPC 白名单：仅 worktree / volume + 空 git capture | `src/adapters/capy/device-tunnel.ts` | 插件策略：生产隧道只承担控制面；其余 handler 一律 `MachineServer.Unavailable` |
| 隧道无 activeRoot、无子进程、无文件工具 | `src/adapters/capy/device-tunnel.ts` | 已删除执行面；handler 侧唯一文件系统操作是 `worktree_ensure` 在 `worktreeBase` 下建目录（设备 token 持久化另属控制面状态） |
| 工具调用 ID = `call_` + ULID | `src/entry/plugin.ts` | Provider 分配；客户端后续以 `tool_call_id` 回传，插件把 ID/参数/结果写进 prompt 文本，不补造 |
| 工具白名单按请求构造 | `src/application/tools.ts` | 方案 C：`PromptToolBridge` 无可变状态，不接受未声明工具 |
| 带工具请求先收全文再编码 | `src/entry/bridge-response.ts` | 调用包必须是完整 JSON；该路径不逐 token 流式 |
| `npm: "@ai-sdk/openai-compatible"` | `src/entry/plugin.ts` | 给 Magpie 的 SDK 提示；Capy 没有官方 SDK |
| `searches: false` | `src/entry/plugin.ts` | 告诉 Magpie 没有搜索能力；不是 Capy 字段 |
| `redact` 模式 | `src/observability/redact.ts` | 安全策略 |

---

## 3. 已删除/修正的自定值

| 之前 | 问题 | 现在 |
|---|---|---|
| `MAX_PROMPT_CHARS=160_000` + 自动裁剪 | 把插件自己的常量当成 Capy 限制，255k 正常对话被误杀 | 删除；`buildPrompt` 原样透传 |
| `MAX_ATTACHMENT_BYTES=20MB` | OpenAPI 实际允许 250MB | spec 改为 `262,144,000` |
| `MAX_ATTACHMENTS=8` / `MAX_TOTAL_BYTES=60MB` | 没有 API 证据；来自别处常量/猜测 | spec 删除；不额外发明限制 |
| `DEFAULT_MODEL_ID="particle/particle-1"` | 不是 Capy 的默认模型；`/models.default` 才是 | 删除常量；不硬编码默认模型 |
| `defaultModelOf()` 回退到第一个模型 | 静默发明默认模型 | 删除 |
| `resolveModelId()` 无 model 时回退第一个 | 同上 | 改为缺少 model 直接 `invalid_request`；调用方应省略 `modelId` 让 Capy 走默认链 |
| `clientId` 缺失时 `randomUUID()` | 伪造 Clerk client 身份 | 改为空字符串；只接受登录适配器提供的真实 `__client` id |
| org 选择回退第一个组织 | 可能把 key 签到错误 org | 只接受 credential org / `preferences.preferredOrgId`，否则报错 |
| 任意 404 都映射 `model_not_found` | 线程/设备 404 语义错误 | 新增 `not_found`；只有 Model 相关 404 才是 `model_not_found` |
| OpenAI error `type` 只有两种 | 400/429 类型错误 | 400/404→`invalid_request_error`，429→`rate_limit_error`，401→`authentication_error` |
| `ChatUsageEvent` | 从未产生、编码器也不处理 | 删除 |
| `hasUsableSession` / `usageAuthError` / `CatalogSource` / `promptToolBridge` 单例 / 多个 `_internal` | 没有调用方 | 删除 |
| entry `DEFAULT_MODEL_ID` / `PUBLIC_API_BASE` / `_internal` 导出 | 没有外部引用 | 收成文件内常量/函数 |
| `ChatUseCase.getJam(...).catch(() => null)` | 静默吞掉状态检查错误，可能掩盖 credits/desktop 阻塞 | 改为让错误向上抛 |
| 内置 `bash` / `bash_output` / `read` / `write` / `edit` / `file_*` handler | 与“隧道仅控制面”冲突，等于把设备变成远程 shell/文件入口 | 删除；统一返回 `MachineServer.Unavailable` |
| `activeRoot` 与设备侧执行状态 | 让隧道持有活动工作目录，容易被当成通用执行面 | 删除；隧道只在 `worktreeBase` 下建目录，不保存 activeRoot |
| 部分采纳工具包 / 模型自带执行结果 | 会把不完整调用或伪造结果当成成功 | 整包校验；结果只接受客户端 `role:"tool"` 消息 |

---

## 4. 兜底清单（保留/删除理由）

| 兜底 | 位置 | 处理 |
|---|---|---|
| live `/models` 失败 → 调用方提供的静态快照 | `CatalogUseCase.loadSnapshot` | **保留**；快照由调用方注入，且不伪造 `default` 链；没有快照就报错 |
| 模型目录为空 → error | `CatalogUseCase` | 保留（明确失败） |
| `provider.models` live + 静态兜底 | `entry/plugin.ts` | 保留；未登录/网络失败时用静态快照 |
| 未登录 `config` 也要有模型 | `entry/plugin.ts` | 保留（Magpie 配置钩子需要） |
| `PublicSseNormalizer.finish` 用 `finalText || lastText` | `application/stream.ts` | 保留；assistant 累积就是答案，transcript 只是校正 |
| SSE 没有 `transcript` 时用 assistant 文本 | `application/stream.ts` | 保留 |
| `ChatUseCase` JWT 缓存 50s | `application/chat.ts` | 保留（性能策略） |
| `buildUsage` 无余额 `used=100` | `application/usage.ts` | 保留（Magpie 路由策略，已注释） |
| `parseToolCalls` 缺 id 的调用直接跳过 | `protocol/openai.ts` | 保留；不伪造 tool_call id |
| 工具包非法/不完整 → `auto` 下按文本返回 | `entry/bridge-response.ts` | 保留；不部分采纳、不伪造调用 |
| `tool_choice` required/指定工具未满足 → 502 `upstream_error` | `entry/bridge-response.ts` | 保留；明确失败，不返回空调用 |
| 工具桥关闭 + required/指定工具 → 400 `invalid_request` | `entry/plugin.ts` | 保留；不静默忽略 |


---

## 5. 未使用/未接线代码（V0 之后）

### 5.1 已接线（V0）

| 代码 | 现状 |
|---|---|
| `LoginUseCase` | 已接 `auth.methods`（本机导入 + 浏览器） |
| `CatalogUseCase` | 已接 `auth.loader /models` 与 `provider.models` |
| `ChatUseCase` | 已接 `/chat/completions`（流式/非流式） |
| `UsageUseCase` | 已接 `auth.usage` |
| `PromptToolBridge` | instruction 已接；输出解析已接；只解析 committed transcript，required/指定工具未满足时明确失败 |
| `DeviceUseCase` + `HeadlessDeviceRuntime` | 已接；真实设备配对/隧道 + 控制面 machine RPC（worktree/volume/空 git capture） |
| `CapyAppClient` / `CapyPublicClient` / `ClerkClient` | 已实现并接线 |
| `FileSecretStore` | 已实现（Windows DPAPI；其他平台 0600） |
| `collectAttachments` + `uploadFiles` | 已接；图片/PDF 走 files 通道 |
| `ConsoleLogger` / `MemoryCache` / `SystemClock` / `SystemIds` | 已在 entry 组合根实例化 |
| `parseChatRequest` / `encodeChatStream` / `encodeCompletion` / `encodeToolCall*` | 已在 entry 使用 |

### 5.2 仍未实现/未接线

| 代码 | 现状 |
|---|---|
| 完整 machine server | 生产隧道只保留 worktree/volume + 空 git capture；bash/文件/浏览器/computer 及其他 handler 一律 `MachineServer.Unavailable` |
| 原生 OpenAI tools | Capy 没有原生 tools 通道；只有方案 C 客户端工具桥，模型可能不按约定返回调用 |
| 浏览器登录的自动化 e2e | 代码已实现；测试只验证启动/取消，完整登录需要人工 |
| 设备/线程删除、旧设备清理 | 没有接；避免破坏性操作 |
| 自动化 e2e / 发布流程 | 未做 |

### 5.3 已删除的死代码

`hasUsableSession`、`defaultModelOf`、`usageAuthError`、`CatalogSource`、
`promptToolBridge` 单例、`ChatUsageEvent`、`errors._internal`、`redact._internal`、
entry 的 `_internal` / `DEFAULT_MODEL_ID` / `PUBLIC_API_BASE` 导出。

### 5.4 机器扫描：没有跨文件引用的导出

扫描规则：`src` + `test` 里除定义文件外没有任何引用。类型被同文件/函数签名使用时会显示 0，属于假阳性，已分类。

| 符号 | 文件 | 分类 |
|---|---|---|
| `ConsoleLogger` / `MemoryCache` / `SystemClock` / `SystemIds` | `adapters/platform/*` | 已实例化；扫描只找跨文件引用 |
| `SecretStorePort` | `ports/platform.ts` | 已由 `FileSecretStore` 实现 |
| `encodeCompletion` | `protocol/openai.ts` | 已被 entry 使用 |
| `UploadCandidate` / `UploadedFile` | `ports/capy-public.ts` | 已被附件上传使用 |
| `CatalogUseCaseOptions` / `CatalogSnapshot` | `application/catalog.ts` | 类型；已接线 |
| `ChatUseCaseOptions` / `ChatRunOptions` | `application/chat.ts` | 类型；已接线 |
| `LoginUseCaseOptions` | `application/login.ts` | 类型；已接线 |
| `UsageUseCaseOptions` / `UsageUseCase` | `application/usage.ts` | 已接线；单测覆盖 buildUsage |
| `LoginSource` / `ChatRole` / `TextPart` / `ImagePart` / `FilePart` / `ChatDeltaEvent` / `ChatFinalEvent` / `ChatErrorEvent` / `ChatDoneEvent` / `BuildPromptOptions` | `domain/*` | 类型/联合体成员，同文件或签名使用 |
| `ErrorKind` / `OpenAiErrorType` / `OpenAiErrorBody` | `domain/errors.ts` | 返回类型/内部类型 |
| `ModelCapabilities` | `domain/model.ts` | `ModelDescriptor` 的字段类型 |
| `AccountProfile` / `DeviceCodeStart` / `EnrolledDevice` / `DeviceCodePoll` / `JamAsk` | `ports/capy-app.ts` | Port 方法签名类型 |
| `ChunkMeta` | `protocol/openai.ts` | encoder 参数类型 |

### 5.5 仍属计划、不是死代码

`src/ports/**` 是冻结接口；`src/application/**` 的部分能力（浏览器/computer、
原生 tools 通道、真实 worktree/volume 语义）还没有实现。它们不是“删掉就行”的死代码，而是明确的后续工作。

---

### 5.6 行为假设/启发式（不是上游保证）

| 假设 | 位置 | 说明 |
|---|---|---|
| assistant 帧若以旧文本为前缀就视为增量，否则拼接 | `application/stream.ts` | 兼容两种 SSE 编码；不是协议保证 |
| transcript 只在“旧文本是前缀”时补 delta | `application/stream.ts` | 无法流式撤回已发内容，只能校正最终文本 |
| `ask.kind` 未知时映射 `upstream_error` | `application/chat.ts` | 只确认 credits/desktop 两类 |
| 非流式 `usage` 全 0 | `protocol/openai.ts` | 占位；不是真实 token 计数 |
| `variants` 每个 reasoningMode 映射到空对象 | `entry/plugin.ts` | Magpie 变体占位；没有真实参数 |
| `parseChatRequest` 只接受 `type:"function"` 工具 | `protocol/openai.ts` | OpenAI 目前只有 function tools |
| `PromptToolBridge` 用固定英文提示词 + JSON 契约 | `application/tools.ts` | 模型可能不配合；不是原生 tools；只接受整段单包（可整段围栏），任一项非法即整包拒绝 |
| 只有 committed transcript 能转成调用 | `entry/bridge-response.ts` | 实时预览在 turn dropped/abort 时可能不完整；据它执行会伪造调用 |
| 带工具请求先收全文再编码 | `entry/bridge-response.ts` | 方案 C 需要完整 JSON 调用包；该路径不逐 token 流式 |
| `isoOf` 数字 >1e12 当毫秒，否则当秒 | `application/usage.ts` | 兼容两种时间戳 |
| 无余额/未知余额统一 `used=100` | `application/usage.ts` | Magpie 路由策略 |
| 所有模型 `image/pdf/attachment` | `domain/model.ts` | files 通道能力，不是模型能力 |

## 6. 仍需随上游核对/会过时的东西

| 项 | 风险 | 处理 |
|---|---|---|
| `static-catalog.ts` | Capy 加/删模型后过时 | 标注生成时间 2026-11-20；`scripts/refresh-catalog.ts` 待实现 |
| `FREE_MODEL_IDS` | 定价页变化 | 手工清单，注释写来源；不要从 billing 反推 |
| `EXTRA_FREE_MODELS` | App-only 模型 id/档位变化 | 来自 App 模型选择器；公共 `/models` 不返回 |
| 模型能力 `image/pdf/tools` | 不是 `/models` 字段 | 目前是通道能力策略；如要精确，需要按模型实测能力表 |
| `capy` provider id | 已切换 | ADR-007 |
| 非流式 `usage` 全 0 | 不是真实用量 | 后续可从 `context-usage`/`usage` 补，或省略 usage |
| `promptVariant:"minimal"` 403 降级 | 已实现：403 自动改 default 重试并记住 | Works |
| 附件上传/SSRF | 已实现；文件缓存未做 | 限制按 250MB/文件；缓存可选 |
| 工具调用 | 只支持方案 C 的文本 JSON 桥，不是原生 tools，也不在 Capy 侧执行 | 保持明确边界；不要宣称原生通道或 Capy 执行客户端工具 |

---

## 7. V0 之后还缺什么

V0 已经能作为 Magpie 插件运行：

- 本机登录 → 无头设备配对 → `/models` 64 条 → `particle-1` 非流式 `pong` / 流式 SSE
- 图片 data URL → files 通道 → `Red`
- usage：余额 / Token / 无头设备

还未做（按优先级）：

1. 浏览器登录的完整人工回归（代码已实现，当前只 smoke 了启动/取消）
2. 原生 tools（Capy 无此通道；当前只有方案 C 客户端工具桥）
3. 浏览器 / computer use（worktree/volume 控制面已实现；bash/文件已从隧道移除）
4. 自动化 e2e / 发布流程

---

## 8. 证据命令

```bash
# 模型目录（含 default/skipped）
curl -H "Authorization: Bearer $CAPY_KEY" https://api.capy.ai/api/v1/models

# 上下文预算
curl -H "Authorization: Bearer $JWT" -H "Origin: https://capy.ai" \
  https://api.capy.ai/app/orgs/$ORG/jams/$JAM/events/context-usage

# 额度
curl -H "Authorization: Bearer $CAPY_KEY" https://api.capy.ai/api/v1/usage
curl -H "Authorization: Bearer $CAPY_KEY" https://api.capy.ai/api/v1/usage/balance

# 公开 OpenAPI（附件 250MB 的来源）
curl https://docs.capy.ai/openapi.json
```
