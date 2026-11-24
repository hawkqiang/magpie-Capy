# magpie-Capy

把 [Capy](https://capy.ai) 接进 [magpie](https://usemagpie.ai) 的 provider 插件。

- **纯无头**：自动注册设备（默认用主机名，这台机器是 `baijiu`），走 Capy device tunnel；运行时不需要 Capy 桌面端。
  隧道只承担控制面（worktree / volume / 空 git capture），不提供 shell、文件读写/编辑或子进程执行。
- **登录**：本机 Capy 客户端导入（只读登录态）/ 浏览器登录（Google / GitHub / Passkey / 邮箱）。
- **对话**：OpenAI 兼容 `/chat/completions`，原生 SSE，流式/非流式。
- **模型**：动态目录 + 静态兜底；3 个免费模型。
- **附件**：图片 / PDF 走 Capy files 通道（单文件 250 MB）。
- **零运行时依赖**：TypeScript + Bun，构建为单个 `dist/index.mjs`。

## 安装

```bash
bun install
bun run build
```

在 Magpie 里添加本仓库路径（或直接指向 `dist/index.mjs`）。provider id 是 `capy`。

## 开发

```bash
bun test
bun run typecheck
bun run build
bun run smoke     # 真实 Capy：本机登录 → models → particle-1 "pong"
```

`smoke` 需要本机已登录 Capy 桌面端。

## 架构

```
entry (Magpie hooks)
  → application (use cases / stream / tool bridge)
    → ports (CapyApp, CapyPublic, DeviceRuntime, SecretStore, …)
      → adapters (Capy App/Public/Device tunnel/DPAPI/Host)
domain: 纯类型/错误/事件，不依赖 I/O
```

详见 [`spec/ARCHITECTURE.md`](./spec/ARCHITECTURE.md) 与 [`spec/CONTRACTS.md`](./spec/CONTRACTS.md)。

## 目录

| 路径 | 内容 |
|---|---|
| `src/domain/` | 纯类型、错误、事件 |
| `src/application/` | 登录、目录、聊天、设备、额度、附件、工具桥 |
| `src/ports/` | 冻结接口 |
| `src/adapters/capy/` | Capy App/Public/Device/SSE/Files/local/browser |
| `src/adapters/host/` | Magpie auth 记录 |
| `src/adapters/platform/` | proxy/DPAPI/HTTP/ULID/clock/logger |
| `src/entry/` | Magpie 插件装配 |
| `src/protocol/` | SSE / OpenAI 编解码 |
| `spec/` | 行为、架构、协议、决策、审计 |

## 免费模型与地区

| 模型 | 免费方式 | 地区 |
|---|---|---|
| `particle/particle-1` | 免费、无广告 | 无地区限制 |
| `zai/glm-5.3-flash-ads` | App 内广告免费 | **仅 US / CA / UK / AU / NZ / IE 出口 IP** |
| `deepseek/deepseek-v4.1-flash-ads` | App 内广告免费 | **仅 US / CA / UK / AU / NZ / IE 出口 IP** |

两个 ADS 模型是 Capy 服务端按**出口 IP** 判定的，不是请求头能绕过的：

- 插件会读取 `MAGPIE_CAPY_PROXY`、`HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY` 或 Windows 系统代理。
- 启动日志会打印 `proxy_enabled`（只打印 host:port，不打印凭据），可以先确认代理是否生效。
- 出口不在支持地区时，插件返回 `region_unsupported`，并在错误里附带 Capy 的原文；
  需要把代理切到支持地区的节点，或改用 `particle/particle-1`。
- ADS 模型还必须带 `ads-models` 客户端能力位；插件只对这两个模型自动加。

## 无头设备与工具

设备名默认取 `os.hostname()`（这台机器是 `baijiu`）；可用 `MAGPIE_CAPY_DEVICE_NAME` 覆盖。
已有设备会通过 `PATCH /app/orgs/{org}/devices/{id}` 自动重命名，不需要重新配对。
Capy 设置里如果还留着旧的 `magpie-headless` 设备，可以在设备页面手动删除；插件只使用当前主机名这台。

设备隧道只接受控制面 handler；其余 handler 一律明确拒绝。没有 activeRoot、子进程或文件工具。

| 能力 | handler |
|---|---|
| 工作区 | `worktree_ensure` / `worktree_list`（当前 list 返回空） |
| 卷 | `volume_landed` / `volume_probe`（回显 `mountPath`，状态为常量） |
| Git | `POST /v1/git/capture`（返回空 `repos`） |
| 命令 / 文件 / 浏览器 | 拒绝：返回 `isError:true` 的工具结果，要求 agent 改输出客户端 JSON 调用包 |

> [!warning]
> 设备 token 仍可让 Capy 发控制面请求，在你的机器上创建 worktree 目录；设备在线状态也会出现在账号里。
> 只安装可信插件、只登录可信账号，不要把这个 token 交给别人。

浏览器 / computer use 仍未实现。

> [!note]
> Capy 的 agent 自带工具：它会先在自己的设备或云端尝试执行，而不一定先问客户端。
> 插件能做的只是**拒绝执行并回一段可读的 `isError` 说明**，诱导它改走客户端 JSON 调用包；
> 这不能强制模型服从，也不是安全边界。真机数据待补（见 `spec/DSH-ACCEPTANCE.md`）。

### 客户端工具（方案 C）

- 每个请求独立白名单；只接受该请求声明的工具名。
- 模型必须只返回一个完整 JSON 调用包（顶层仅 `tool_calls`，每项仅 `name` + `arguments`）；
  可整段套一层 ``` 或 ```json 代码围栏；`auto`/`required` 下一个包可含多项合法调用，
  指定某个工具时要求恰好 1 个调用；任一项非法或夹带正文则整包拒绝。
- 只有 Capy 已提交的 assistant transcript 才解析调用；实时预览/未提交文本不转调用；
  若上游只有预览，按普通文本返回 `finish_reason:"stop"`，不回撤也不标记截断。
- `tool_choice:"required"` / 指定工具未满足 → 502 `upstream_error`，不返回空调用。
- 调用 ID 由插件分配（`call_<ULID>`），后续回合客户端以 `tool_call_id` 回传（仅去首尾空白）；
  插件把 ID、工具名、参数写入 prompt 的 `<tool_call>`，客户端结果绑定为 `<tool_result>`，
  这不是原生字段。结果只能来自客户端。
- Capy 没有原生 tools 通道；这不是原生工具通道。带工具请求会先收完整文本再返回，
  首字节推迟到生成结束，不逐 token 流式。

## 边界

- 无头设备只实现控制面（worktree / volume / 空 git capture）；bash / 文件 / 浏览器 / computer use 不可用。
- 隧道仅控制面是缩小攻击面，不代表数据面其它路径（提示词、工具桥、附件）安全。
- 免费 ADS 模型（GLM-5.3-Flash / DeepSeek V4.1 Flash）只允许这些出口 IP：
  US / CA / UK / AU / NZ / IE。插件会自动读取 `MAGPIE_CAPY_PROXY`、`HTTPS_PROXY`
  和 Windows 系统代理，并在日志里打印 `proxy_enabled`；出口不在支持地区会返回
  `region_unsupported`，这是 Capy 服务端限制，插件无法绕过。
- 没有原生 OpenAI tools；只有方案 C 客户端工具桥（每请求白名单、完整单包、required 未满足明确失败），
  结果只由客户端产生。
- 没有数据库/队列：插件是请求作用域 + 本地 device token。
- 同一 Magpie 里只安装一份 `capy` 插件。

## License

MIT
