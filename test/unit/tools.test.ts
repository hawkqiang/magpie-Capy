import { expect, test } from "bun:test";

import { PromptToolBridge } from "../../src/application/tools.ts";
import { parseCmdTags, primaryArg } from "../../src/application/cmd-tags.ts";
import type { ToolDefinition } from "../../src/domain/chat.ts";

const pwsh: ToolDefinition = {
  type: "function",
  function: {
    name: "pwsh",
    description: "Run PowerShell",
    parameters: {
      type: "object",
      properties: { command: { type: "string" }, description: { type: "string" } },
      required: ["command", "description"],
    },
  },
};
const read: ToolDefinition = {
  type: "function",
  function: {
    name: "read",
    description: "Read file",
    parameters: { type: "object", properties: { file_path: { type: "string" } }, required: ["file_path"] },
  },
};

const edit: ToolDefinition = {
  type: "function",
  function: {
    name: "edit",
    description: "Edit file",
    parameters: {
      type: "object",
      properties: {
        file_path: { type: "string" },
        old_string: { type: "string" },
        new_string: { type: "string" },
        replace_all: { type: "boolean" },
      },
      required: ["file_path", "old_string", "new_string"],
    },
  },
};

const bridge = new PromptToolBridge();

test("instruction：用 <CMD>/<TOOL_CALL> 协议，无工具/choice=none 为空", () => {
  const text = bridge.instruction([pwsh], "auto");
  expect(text).toContain("<CMD>");
  expect(text).toContain("pwsh");
  expect(text).toContain("PowerShell");
  expect(text).not.toContain("<DONE>");
  expect(bridge.instruction([], "auto")).toBe("");
  expect(bridge.instruction([pwsh], "none")).toBe("");
  const forced = bridge.instruction([pwsh, edit], { type: "function", function: { name: "edit" } });
  expect(forced).toContain('"edit"');
  expect(forced).toContain("<TOOL_CALL>");
});

test("primaryArg：pwsh→command，read→file_path", () => {
  expect(primaryArg(pwsh)).toBe("command");
  expect(primaryArg(read)).toBe("file_path");
});

test("parse：<CMD> 命令体原样变成 tool_calls 的 command 参数并自动补 description", () => {
  const text = "<CMD>echo hi</CMD>";
  expect(bridge.parse(text, [pwsh], "auto")).toEqual({
    calls: [{ name: "pwsh", arguments: JSON.stringify({ command: "echo hi", description: "echo hi" }) }],
  });
});

test("parse：命令里的 $、引号、换行不被破坏（这是换 <CMD> 的核心目的）", () => {
  const cmd = '$ws = "C:\\Users\\x"\nif (Test-Path $ws) { "$ws => $(Test-Path $ws)" }';
  const parsed = bridge.parse(`<CMD>${cmd}</CMD>`, [pwsh], "auto");
  expect(parsed).not.toBeNull();
  const args = JSON.parse(parsed!.calls[0]!.arguments) as { command: string };
  expect(args.command).toBe(cmd); // 逐字节一致：$、"、换行全部保留
});

test("parse：多行脚本整体保留，只去掉首尾换行", () => {
  const text = "<CMD>\nGet-Process |\n  Where-Object { $_.Name -match 'adb' }\n</CMD>";
  const args = JSON.parse(bridge.parse(text, [pwsh], "auto")!.calls[0]!.arguments) as { command: string };
  expect(args.command).toBe("Get-Process |\n  Where-Object { $_.Name -match 'adb' }");
});

test("parse：<CMD tool> 指定工具，按该工具主参数填充", () => {
  const text = "<CMD tool=\"read\">C:\\tmp\\a.txt</CMD>";
  expect(bridge.parse(text, [pwsh, read], "auto")).toEqual({
    calls: [{ name: "read", arguments: JSON.stringify({ file_path: "C:\\tmp\\a.txt" }) }],
  });
});

test("parse：多 <CMD> 多调用；<DONE> 不被当成调用", () => {
  const result = bridge.parse("<CMD>echo a</CMD><CMD>echo b</CMD>", [pwsh], "auto");
  expect(result?.calls.length).toBe(2);
  expect(bridge.parse("<DONE>完成了</DONE>", [pwsh], "auto")).toBeNull();
});

test("parse：没有 <CMD> 的纯文本 → null（普通聊天）", () => {
  expect(bridge.parse("pong", [pwsh], "auto")).toBeNull();
  expect(bridge.parse("{\"tool_calls\":[]}", [pwsh], "auto")).toBeNull();
});

test("parse：空 <CMD> / 未声明工具都忽略", () => {
  expect(bridge.parse("<CMD>   </CMD>", [pwsh], "auto")).toBeNull();
  // 指定未声明工具 → 回退到默认工具（不是拒绝整个包，但仍合法）
  const r = bridge.parse("<CMD tool=\"nope\">echo x</CMD>", [pwsh], "auto");
  expect(r?.calls[0]?.name).toBe("pwsh");
});

test("parse：choice=none / 指定工具不匹配 / 无效 choice 拒绝", () => {
  const call = "<CMD>echo hi</CMD>";
  const forced = { type: "function", function: { name: "read" } };
  expect(bridge.parse(call, [pwsh], "none")).toBeNull();
  expect(bridge.parse(call, [pwsh], "unknown")).toBeNull();
  expect(bridge.parse(call, [], "auto")).toBeNull();
  expect(bridge.parse(call, [pwsh], forced)).toBeNull(); // 指定 read 却调 pwsh
  expect(bridge.parse("<CMD tool=\"read\">x</CMD>", [pwsh, read], forced)).not.toBeNull();
});

test("parseCmdTags：未闭合标签不误判", () => {
  expect(parseCmdTags("<CMD>unterminated", new Set(["pwsh"]))).toBeNull();
});

test("parse：反引号里的 `<CMD>` 示例与占位符不污染真实 <CMD> 标签", () => {
  const prose = '请不要输出 `<CMD>` 占位符 `<CMD>...</CMD>`，而是直接调用：\n<CMD tool="pwsh">Get-ChildItem</CMD>';
  const parsed = bridge.parse(prose, [pwsh], "auto");
  expect(parsed).toEqual({
    calls: [{
      name: "pwsh",
      arguments: JSON.stringify({ command: "Get-ChildItem", description: "Get-ChildItem" }),
    }],
  });
});

test("parse：<TOOL_CALL> 与整段 JSON 支持多参数 edit/read", () => {
  const tagged = '<TOOL_CALL>{"name":"edit","arguments":{"file_path":"a.txt","old_string":"old","new_string":"new","replace_all":true}}</TOOL_CALL>';
  expect(bridge.parse(tagged, [pwsh, edit], "auto")).toEqual({
    calls: [{
      name: "edit",
      arguments: JSON.stringify({ file_path: "a.txt", old_string: "old", new_string: "new", replace_all: true }),
    }],
  });
  const forcedEdit = { type: "function", function: { name: "edit" } };
  expect(bridge.parse(tagged, [pwsh, edit], forcedEdit)).not.toBeNull();

  const jsonPacket = JSON.stringify({
    tool_calls: [{ name: "pwsh", arguments: { command: "Get-Date" } }],
  });
  expect(bridge.parse(jsonPacket, [pwsh], "auto")).toEqual({
    calls: [{
      name: "pwsh",
      arguments: JSON.stringify({ command: "Get-Date", description: "Get-Date" }),
    }],
  });
});
