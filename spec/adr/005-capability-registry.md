# ADR-005 — 能力注册表 + 模型策略 + 可替换 ToolBridge

## 状态

Accepted

## 背景

模型目录会持续增长（GPT-6、Claude Fable 5.x、Opus 5.5…），能力（图片/工具/推理档位）不同；
未来 Capy 可能提供原生 tools。把模型名/能力写进 if/else 会持续腐化。

## 决策

- `ModelDescriptor` 是数据；`CapabilityRegistry` 把 descriptor → OpenAI capabilities。
- `ModelPolicy` 可组合：free-first、能力 override、context budget、未来 cost/latency。
- `ToolBridge` 是 port：
  - 当前 `PromptToolBridge`（提示词 + JSON 解析）
  - 未来 `NativeToolBridge`（不改 application）
- `StreamNormalizer` 同样可替换（PublicSSE / AppNDJSON）。
- 不假设模型数量/名称/上下文窗口；动态目录 + 静态兜底。

## 后果

- 新模型/新能力主要是数据/策略改动。
- 工具桥可独立测试；不污染 chat 流程。
- 需要维护能力映射与测试。

## 备选

- 每个模型写分支：不可持续。
- 直接透传供应商 capabilities：Capy 目录没有完整能力字段。
