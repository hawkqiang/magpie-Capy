import type { ToolCall, ToolDefinition } from "../domain/chat.ts";

export interface ToolParseResult {
  readonly calls: readonly Omit<ToolCall, "id">[];
}

export interface ToolBridgePort {
  /** 生成追加到 prompt 的工具说明；没有工具时返回空串。 */
  instruction(tools: readonly ToolDefinition[], toolChoice: unknown): string;
  /** 从模型文本里解析 tool_calls；没有则 null。 */
  parse(text: string, tools: readonly ToolDefinition[], toolChoice: unknown): ToolParseResult | null;
}
