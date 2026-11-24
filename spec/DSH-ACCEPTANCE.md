# DSH → Magpie → Capy 验收记录

基线：上游 `1138ed636f2eaa3fb98489ba10ccf073b9eebf0a`，本地 DSH 0.2.2-rc.5，Magpie 0.1.4689。DSH 侧须用 OpenAI Chat Completions，不是 Responses。保持默认审批策略。本文的检查步骤不是已通过的结果。

## 证据与限制

- Magpie 插件的 `auth.loader().fetch` 收到 HTTP 请求而非 DSH 工具对象。`parseChatRequest` 从请求体读入工具和选择；实际字段必须在此边界观察，不能从 DSH 声明或模型列表倒推。
- [Capy Streaming](https://docs.capy.ai/api-reference/streaming) 明确：`tool_call` 只含 `callId,name,text`，text 是一行摘要，不包含参数或结果。把该事件转成 OpenAI 调用会丢失参数，且可能重复执行。[API 概览](https://docs.capy.ai/api-reference/overview) 描述的是远端 Agent 线程，而非原始模型推理 API。
- Machine RPC 是实际设备操作请求，协议要求响应原调用；它不是 DSH 动态工具目录。要用方案 B，必须证明动态注册、参数/结果语义和中断/恢复、关联及隔离，而非把 Capy `bash` 重命名为 `pwsh`。
- 当前实现每次请求建一个 jam，历史重放不是恢复 Capy 内部挂起的调用。方案 C 只解析模型最终文本；即使对 DSH 编码为结构化调用，也不改变上游是文本模拟的事实。
- 实机基线：本机 Magpie `/v1/models` 返回 `capy/deepseek/deepseek-v4.1-flash-ads`。对 `/v1/chat/completions` 发送仅 `messages`、`model`、`stream:false` 的请求，收到 HTTP 502，Capy 明确拒绝当前地区的广告模型。这是无工具请求，不能用作工具成功或 worktree 故障的证据。运行实例的构建版本与工作区产物未核实一致。不要用其它模型、模拟 RPC 或直接调用 loader 代替全链路验收。

## 2026-11-23 真机进展（梯子代理后）

- 地区限制通过本机梯子解决；`capy/deepseek/deepseek-v4.1-flash-ads` 普通请求 200 返回 PONG（约 14s）。
- **工具转换已真机验证**：带 `tools:[calculator]` 的请求返回标准 `finish_reason:"tool_calls"`、完整 call id 和字符串 arguments（约 25s）。这证明 OpenAI 工具调用格式的出口可用。
- **Magpie 按请求重建插件实例**：实例级线程缓存无法跨请求存活（诊断确认每轮 `plugin.construct` 不同实例）。已按 ADR-009 加 `ThreadStorePort` 文件存储；诊断确认 `reused:true`、worktree 不再每轮新建。
- **线程复用对首字无收益**：实测新建 32s、复用 45s/46s，瓶颈在 Capy agent 推理与梯子网络，不在线程创建。真正的首字优化要换官方 DeepSeek API，不要靠线程复用。
- 当前构建已从 `default-workspace\magpie-Capy`（旧）切到 `project2\magpie-Capy`（新），旧 `plugins.json` 已备份。新构建把设备隧道收窄为控制面，Capy 不再有 shell/文件执行入口。

## 真机复测（剩余待执行）

当前实现状态：本地 `bun test` 88 项全绿、`tsc --noEmit` 与 `bun run build` 通过。下列 DSH 全链路项仍待在 DSH GUI 完成：

1. 在已有账号可正常使用的 V4.1 路由上，Magpie 仅加载一个待测 `capy` 构建。记录产物哈希、实际模型 ID，不记录凭据。DSH 新会话选择相应 Chat Completions 路由。
2. 无工具请求要求回复 `baseline-ok`；记录状态和响应。随后打开工具；若 Magpie 进程设置 `MAGPIE_CAPY_TOOL_DIAGNOSTICS=1`，记录 `provider.tools` 的 `{toolsCount,choice,namedDeclared,stream}`（只有计数/枚举，不含工具名或参数）。
3. 在空测试目录、DSH 审批开启的情况下，要求模型仅通过本地 PowerShell 生成随机 GUID 并保存到 `probe.txt`，然后用独立的 DSH 读取工具读文件，再用 PowerShell 对该文件计算 SHA-256。要求从实际结果回答 GUID 和哈希。不要在提示中提供预期值。
4. 从 DSH 工具卡与本地文件独立核对 GUID 和哈希，核对先后至少两轮 `assistant.tool_calls` → `role:tool` 的 ID、终止原因；确认结果由 DSH 产生，未在 Capy 隧道内执行。仅有最终文字、模型自称运行过或只看到 Capy SSE 摘要均不算通过。
5. 同一 Magpie 路由另行发起非流式与流式探针；核对 `message.tool_calls` / `delta.tool_calls`、调用 ID、字符串参数、`finish_reason:tool_calls` 以及 SSE 结束。连续创建两个 jam 并记录是否仍报 worktree 初始化错误。不要记录具体的本机私有路径或令牌。
6. 回归普通文本（流式/非流式）、附件、登录状态与 `tool_choice:"none"`，确认控制面收窄没有破坏原有聊天。

## 已知边界（不要当成验收通过）

- 旧 `activeRoot` 缺陷的单元测试证明的是“新结构里该状态不存在且相邻 ensure 互不影响”，不是“旧二进制运行时失败”。旧实现的错误接线位于原 `HeadlessDevice` 分发链；该类未导出，当前没有运行时回放测试。真机连续两个 jam 才能补上这层证据。
- 带工具请求会先收完整文本再返回，首字节推迟到生成结束；首字节超时比普通聊天更容易触发。
- 上游只有未提交预览时按普通文本返回 `finish_reason:"stop"`，不回撤也不标记截断；调用方无法区分完整答复与被丢弃的半截。
- 隧道只保留控制面是缩小攻击面，不证明 Capy 数据面其它路径（提示词、工具桥、附件）安全；也没有测试能证明 Capy 服务端不会尝试内部工具。
- 方案 C 依赖模型遵守 JSON 调用包约定；Capy 没有原生 tools 通道，不能用“原生支持”措辞。
- Capy 侧 agent 自带工具：即使 DSH 声明了工具，上游也可能先在自己的设备/云端执行，
  而不会先输出调用包。插件只能把内置 handler 的拒绝写成可读的 `isError` 结果诱导它改走契约，
  无法强制；`tool_call` SSE 与 `transcript(source=tool)` 只作为“上游用过内部工具”的信号
  （`ChatFinalEvent.internalTools`），不转成调用。这一点尚无真机数据，验收时要专门观察。
- 已知加固缺口（本次未改结构）：隧道 handler 内的 `lstatSync` / `mkdirSync` / `existsSync` 都在
  WebSocket 消息回调里同步执行，Capy 可连续下发 `worktree_ensure` 拖慢同进程聊天；
  streams Map 与 `Buffer.concat` 没有大小/数量上限，服务端可施加内存压力。
- `HeadlessDeviceOptions.worktreeBase` 没有调用方传入，是遗留死参数；实际基目录恒为内置默认路径。

## 2026-11-25 方案 B + 多参数截获真机验收（`capy/particle/particle-1`）

- 离线构建与测试：`bun test` 103/103 全绿、`tsc --noEmit` 通过、`bun run build` 生成 `dist/index.mjs`、`bun run smoke` 通过（64 models，200 `pong`）。
- DSH `headless` 端到端全链路（`session-9c93ff23-d318-47db-85a8-6822672ec593`，独立临时目录）：
  - 完整执行 9 次工具调用（`pwsh`、`read`、`edit`、`pwsh` 触发 `AssertionError`、`edit` 修复、`pwsh` 复跑通过输出 `hello capy:12`），`callId` 9/9 唯一无重复执行，总耗时 89.7s，单步 6.9s–12.0s。
- 网关并发隔离（双请求并发）：两路同时抵达的请求分别绑定独立 `jamId`，同时走 `chat.shortcircuit` 在 8.3s / 8.8s 返回各自 `pwsh` 与 `read` 调用，无串台或 worktree 越界错误。
- `edit` 强制调用慢响应定位：带 `read` 上下文的 `auto` 模式走 Machine RPC 即时短路约 7.1s–15.0s；未先读文件而强制 `tool_choice: edit` 时，上游先试调 `read` 被拒/退化文本导致首两次返回 502（`internalTools:true, calls:0`），经 Magpie 网关自动重试后第 3~4 次命中 `chat.shortcircuit` 成功，累计耗时 34s–52s。
