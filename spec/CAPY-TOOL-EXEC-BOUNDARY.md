# 最终结论：DSH→Magpie→Capy 工具执行的边界（真机穷举）

## 决定性证据（2026-11-24 真机，diag.log）

走 Magpie 无头设备隧道时，Capy 下发的 invocation 分布（53 次采样）：

| handler | 次数 | 含义 |
|---|---|---|
| volume_landed / volume_probe | 14 / 14 | Capy 反复探测 drive 挂载 |
| worktree_list / worktree_ensure | 9 / 2 | 控制面 |
| **bash** | **6** | **全部是 `__capy_co_author` guard 脚本，无一条真实任务命令** |
| read | 3 | 读 win.ini / package.json（配置探测） |
| mcp_sync | 2 | `servers:[]`——MCP 机器侧同步，空配置 |
| workspace_index / terminal_sessions | 2 / 1 | 基础设施 |

关键事实：
1. **真实任务命令（dir/ls/echo）从未通过隧道到达**。隧道收到的 bash 全是 Capy 注入的 git guard 脚本。
2. **MCP 走 `mcp_sync` 下发**，但这台无头设备的 `servers` 是空数组——Capy 没把它当 MCP 运行机。
3. 用户在 Capy 界面手动执行成功，用的是**Capy 桌面客户端自己的进程**（`~/.capy/drive` + 客户端内置 shell），和插件注册的无头设备（`device_01M83CM1...`）是**两台不同设备、两套隔离执行环境**。

## 结论（不可绕过）

**Capy 的工具执行在它自己的 agent 进程/客户端里闭环，Magpie 的无头设备隧道只拿到基础设施 RPC，拿不到真实工具调用。**

因此：
- 想让 DSH 拿到并能执行 tool_calls → **Capy 这条链路做不到**（不是配置问题，是 Capy 架构把工具执行留在自己侧）。
- `<CMD>` 提示词桥是唯一的例外通道，但概率性（模型有手就用，不倾向把命令让给客户端）。
- MCP 是给 Capy 自己用的工具源（且本机无头设备被 `servers:[]` 排除），不是导出给 DSH 的通道。

## 可行方案（按可靠性）

1. **工具任务换原生 tools 模型**（gpt-6.2-astra / 官方 DeepSeek）：DSH 工具卡 + 沙箱完整生效，100% 可靠。
2. **纯文本任务用 Capy** 省 token。这是 Capy 在 DSH 里唯一稳定可靠的用法。
3. 若接受"Capy 自己执行、DSH 只显示最终文本"：直接在 Capy 客户端/网页用，最稳，但 DSH 的工具审批/沙箱不生效（用户已表示可接受沙箱在 Capy 侧设）。

## 已尝试且失败的路径（留档）

- OpenAI tools 原生：Capy 无此协议。
- MCP STDIO：协议桥写好并本地测通，但 Capy 报 "No machine can run this server now"（服务端机器判定，客户端在线也不行）。
- Machine RPC 捕获真任务命令：隧道根本收不到真任务命令，只收到 guard 脚本。
- 冒充桌面客户端 hello（desktop 0.9.2 + workspace）+ internalExec 执行：隧道层执行能力已验证可用（WorktreeMachine 能跑 PowerShell），但 Capy 不下发真任务命令给它，等于空转。
