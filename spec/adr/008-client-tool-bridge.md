# ADR-008 — 方案 C：客户端执行，Provider 仅翻译

Capy 没有原生 OpenAI tools 通道。每个请求独立建立白名单；ToolBridgePort.parse 必须同时接收该请求的工具和 choice，不保存共享可变状态。仅完整 JSON 调用包可以转为 OpenAI 调用（允许恰好包住整段的单层 ```json 围栏；散文、尾随文本、围栏外内容一律拒绝），任何无效项使整包无效。auto 的非调用输出是普通文本；required / 指定工具未满足时明确失败。只有 Capy 已提交的 assistant transcript（`committed: true`）可以作为调用依据；turn dropped/中断留下的实时预览只能当普通文本，不能变成调用。模型绝不能代填执行结果。调用 ID 由 provider 在返回调用时分配，后续回合透传同一 ID、参数及客户端提交的实际结果。

提示词不是隔离机制：Capy 设备线程本身具备 Machine RPC 执行能力，靠提示词约束不可靠；因此生产隧道固定为仅控制面（worktree/volume/空 git capture），其它 handler 一律拒绝。这一控制面限制不证明 Capy 数据面其它路径安全；不能只禁同名工具或依赖提示词。
