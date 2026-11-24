# ADR-009 — 线程复用与 ThreadStorePort

## 背景

Magpie 按请求重建 Provider 插件实例：`auth.loader()` 每次调用都在新的插件实例里执行。因此 `ChatUseCase` 的实例级 `Map<会话, threadId>` 无法跨请求存活，线程复用不可行。

## 决策

1. 新增 `ThreadStorePort`（`load/save/remove`），生产实现 `FileThreadStore` 把 `会话key → {threadId, cursor, model, updatedAt}` 落到 `MAGPIE_CAPY_STATE_DIR/threads.json`（与设备凭据同目录，0600 原子写，TTL 12h，上限 500 条）。只存引用，不存消息内容。
2. `ChatUseCase` 通过注入的 store 读写线程引用；跨请求重建插件后仍可复用。
3. 会话 key = `accountKey|model|稳定hash(首条user消息,去掉system-reminder前240字符)`。同名首条消息会串台，这是已知启发式。
4. 复用时用 `POST /threads/{id}/message` 发增量（只取最新 tool 结果或 user 任务，不重发 assistant），并用 `after=<cursor>` 跳过旧 transcript。
5. `MAGPIE_CAPY_THREAD_REUSE=0` 或 `options.threadReuse:false` 可关闭，退回每请求新建线程。

## 真机结论（2026-11-23）

线程复用**技术上生效**（诊断确认 `reused:true`、仅一个 worktree），但首字延迟未改善：新建线程 32s、复用 45s/46s。瓶颈是 Capy agent 推理与梯子网络，不是线程创建。因此该优化被判定为**低价值**；默认仍开启（无副作用），但不宣称其解决首字问题。真正的首字优化需改用官方 DeepSeek API。

## 后果

端口从冻结状态新增一个（`ThreadStorePort`），按 AGENTS 规范以本 ADR 记录。既有端口签名未变。
