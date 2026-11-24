# DECISIONS — ADR 索引

| ADR | 决策 | 状态 |
|---|---|---|
| [001](./adr/001-stack.md) | TypeScript + Bun + 零运行时依赖 | Accepted |
| [002](./adr/002-hexagonal.md) | Hexagonal + 控制面/数据面分离 | Accepted |
| [003](./adr/003-headless-device.md) | 无头设备，不依赖 Capy 桌面端运行 | Accepted |
| [004](./adr/004-native-sse.md) | 原生 SSE + ChatEvent 归一 | Accepted |
| [005](./adr/005-capability-registry.md) | 能力注册表 + 模型策略 + 可替换 ToolBridge | Accepted |
| [006](./adr/006-no-database.md) | 不引入数据库/队列；DPAPI 极小状态 | Accepted |
| [007](./adr/007-provider-id.md) | provider id = `capy` | Accepted |
| [008](./adr/008-client-tool-bridge.md) | 方案 C 客户端工具桥；隧道仅控制面 | Accepted |
| [009](./adr/009-thread-store.md) | 线程复用 + ThreadStorePort（真机低价值，默认开） | Accepted |
