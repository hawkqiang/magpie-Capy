# ADR-004 — 原生 SSE + ChatEvent 归一

## 状态

Accepted

## 背景

轮询 `events/outline` 会等完整答案，首字延迟高，且大量无效请求。公共 API 提供原生 SSE
（`/api/v1/threads/{id}/stream?until=run`），assistant 帧可实时转发。

## 决策

- 主路径：原生 SSE；不轮询。
- `StreamNormalizer` 把上游事件归一成 `ChatEvent`（delta/final/error/done）。
- `OpenAISseEncoder` 是唯一知道 `data:`/`[DONE]` 的地方。
- 流不可用时返回明确错误；outline 轮询 fallback 未实现，不静默切换。
- assistant 帧按 `callId` 累积；重复全文去前缀；transcript 校正最终文本。

## 后果

- 首字最快；测试可对事件快照，不解析字符串。
- SSE 解析需处理 CRLF、多 data、心跳、dropped turn。
- 断线重试必须避免重复内容。

## 备选

- 轮询：简单但慢，已淘汰。
- App NDJSON：保留为未来 normalizer，不作为主路径。
