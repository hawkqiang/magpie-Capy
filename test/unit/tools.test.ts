import { expect, test } from "bun:test";

import { PromptToolBridge } from "../../src/application/tools.ts";
import type { ToolDefinition } from "../../src/domain/chat.ts";

const tools: ToolDefinition[] = [{
  type: "function",
  function: {
    name: "get_weather",
    description: "Get weather",
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
    },
  },
}];

const bridge = new PromptToolBridge();

test("instruction：包含工具名和 JSON 格式；无工具为空", () => {
  const text = bridge.instruction(tools, "auto");
  expect(text).toContain("get_weather");
  expect(text).toContain("tool_calls");
  expect(bridge.instruction([], "auto")).toBe("");
  expect(bridge.instruction(tools, { type: "function", function: { name: "get_weather" } }))
    .toContain("must call the tool \"get_weather\"");
});

test("parse：标准 JSON / fenced / prose / single", () => {
  expect(bridge.parse("{\"tool_calls\":[{\"name\":\"a\",\"arguments\":{\"x\":1}}]}"))
    .toEqual({ calls: [{ name: "a", arguments: "{\"x\":1}" }] });
  expect(bridge.parse("```json\n{\"tool_calls\":[{\"name\":\"b\",\"arguments\":{}}]}\n```"))
    .toEqual({ calls: [{ name: "b", arguments: "{}" }] });
  expect(bridge.parse("Sure.\n{\"tool_calls\":[{\"name\":\"c\",\"arguments\":{\"y\":2}}]}\nDone."))
    .toEqual({ calls: [{ name: "c", arguments: "{\"y\":2}" }] });
  expect(bridge.parse("{\"name\":\"d\",\"arguments\":\"{\\\"z\\\":3}\"}"))
    .toEqual({ calls: [{ name: "d", arguments: "{\"z\":3}" }] });
});

test("parse：普通文本 / 非工具 JSON → null", () => {
  expect(bridge.parse("pong")).toBeNull();
  expect(bridge.parse("{\"a\":1}")).toBeNull();
});

test("parse：大量未闭合花括号不会平方级扫描", () => {
  const text = "{".repeat(5_000);
  expect(new PromptToolBridge().parse(text)).toBeNull();
});
