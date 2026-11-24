// Never return caller strings: names, schemas and even IDs can carry private data.
export function providerMetadata(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const tools = Array.isArray(b.tools) ? b.tools : [];
  const c = b.tool_choice === null ? undefined : b.tool_choice;
  const named = c && typeof c === 'object' && 'type' in c && c.type === 'function' && 'function' in c ? c.function : undefined;
  const name = named && typeof named === 'object' && 'name' in named && typeof named.name === 'string' ? named.name : undefined;
  return {
    toolsCount: Array.isArray(b.tools) ? tools.length : b.tools == null ? 0 : null,
    choice: c === undefined ? 'absent' : c === 'auto' || c === 'required' || c === 'none' ? c : name !== undefined ? 'named' : 'invalid',
    ...(name === undefined ? {} : { namedDeclared: tools.some(t => (t as { type?: unknown; function?: { name?: unknown } })?.type === 'function' && (t as { function?: { name?: unknown } }).function?.name === name) }),
    stream: b.stream === true,
  };
}
