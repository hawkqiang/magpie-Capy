# ADR-003 — 无头设备，不依赖 Capy 桌面端运行

## 状态

Accepted

## 背景

Capy 的免费模型线程绑在 device 上；早期实现要求启动 Capy 桌面端。桌面端关闭/未登录即 503。
设备隧道与最小 machine RPC 已取证：device code 配对、`capyd_` token、`hello/session-config/ready`、
`worktree_*`/`volume_*`/`git capture` 足够跑文本/图片对话。

## 决策

- 首次使用自动 `POST /app/devices/code` → approve → poll，注册以主机名命名的设备（如 `baijiu`）。
- device token 存用户目录：Windows DPAPI；macOS/Linux 0600 文件；连接 device tunnel。
- 设备登记上报 `win32 | darwin | linux`；只要宿主有 WebSocket 就能运行，不绑定 Windows。
- 连接失败先复用同一 token 重连；仅服务端明确拒绝 token 时才重新配对（防重复注册）。
- 实现**最小 machine RPC**；其他 handler 返回 `MachineServer.Unavailable`。
- 运行时不要求 Capy 进程/窗口/文件。
- 「本机导入」只作为登录方式，只读登录态，不提供算力（该登录路径仍限 Windows）。

## 后果

- 纯文本/图片对话可无桌面运行。
- 终端/浏览器/写文件等 coding agent 工具不可用（明确边界）。
- 设备 token 状态是本机唯一持久 secret。
- 免费广告模型仍受地区/代理限制。

## 备选

- 云端线程：需要 credits，免费模型不可用。
- 要求桌面端：旧行为，已放弃。
- 浏览器/computer 的完整 machine server：工程量大，不是本次目标。
