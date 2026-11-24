import { expect, test } from 'bun:test';
import { PromptToolBridge } from '../../src/application/tools.ts';
import { CapyError } from '../../src/domain/errors.ts';
import { buildPrompt } from '../../src/domain/chat.ts';
import { parseChatRequest, collectText, collectReply } from '../../src/protocol/openai.ts';
import { providerMetadata } from '../../src/entry/provider-metadata.ts';
import { bridgeResponse } from '../../src/entry/bridge-response.ts';

const tools = [{
  type: 'function' as const,
  function: { name: 'one', parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } },
}, { type: 'function' as const, function: { name: 'two', parameters: { type: 'object', properties: { command: { type: 'string' } } } } }];
const call = '<CMD>echo x</CMD>';
const base = { model: 'm', messages: [{ role: 'user', content: 'private' }], tools };
const bridge = new PromptToolBridge();

test('cmd tags: whitelist and choice', () => {
  expect(bridge.parse(call, tools, 'none')).toBeNull();
  expect(bridge.parse(call, tools, { type: 'function', function: { name: 'two' } })).toBeNull();
  expect(bridge.parse('普通回答没有命令', tools, 'auto')).toBeNull();
  expect(bridge.parse(call, tools, 'auto')).toEqual({
    calls: [{ name: 'one', arguments: JSON.stringify({ command: 'echo x' }) }],
  });
  expect(bridge.instruction(tools, 'none')).toBe('');
});

test('invalid forced choice fails before data plane', () => {
  for (const choice of ['unknown', { type: 'function', function: { name: 'other' } }]) {
    expect(() => parseChatRequest({ ...base, tool_choice: choice })).toThrow();
  }
});

test('prompt links real result to call with original args, bytes and id', () => {
  const prompt = buildPrompt(parseChatRequest({
    ...base,
    messages: [
      { role: 'assistant', content: null, tool_calls: [{ id: 'id1', type: 'function', function: { name: 'one', arguments: '{"x":2}' } }] },
      { role: 'tool', name: 'one', tool_call_id: 'id1', content: '  hi  ' },
    ],
  }).messages);
  expect(prompt.match(/id1/g)?.length).toBe(2);
  expect(prompt).toContain('  hi  ');
  expect(prompt).toContain('one');
  expect(prompt).toContain('2');
});

test('metadata does not retain any caller string', () => {
  expect(providerMetadata({
    ...base,
    tools: [{ type: 'function', function: { name: 'private', description: 'private' } }],
    tool_choice: { type: 'function', function: { name: 'private' } },
  })).toEqual({ toolsCount: 1, choice: 'named', namedDeclared: true, stream: false });
});

test('metadata aligns null with parser: absent', () => {
  expect(providerMetadata({ tools: null, tool_choice: null })).toEqual({ toolsCount: 0, choice: 'absent', stream: false });
});

async function* events(text: string, committed = true) {
  yield { type: 'delta' as const, text: 'stale' };
  yield { type: 'final' as const, text, committed };
}

test('both modes return only validated calls; required does not invent results', async () => {
  for (const stream of [true, false]) {
    const req = parseChatRequest({ ...base, stream, tool_choice: 'required' });
    const response = await bridgeResponse(req, events(call), { id: 'm', model: 'm', created: 1 }, bridge, () => 'id1');
    const text = await response.text();
    expect(text).toContain('"finish_reason":"tool_calls"');
    expect(text).toContain('"id":"id1"');
    expect(text).not.toContain('stale');
    if (stream) expect(text).toContain('[DONE]');
    await expect(bridgeResponse(req, events('plain'), { id: 'm', model: 'm', created: 1 }, bridge, () => 'id1')).rejects.toBeInstanceOf(CapyError);
  }
  expect(await collectText(events('corrected'))).toBe('corrected');
});

test('uncommitted preview never becomes a tool call', async () => {
  const req = parseChatRequest({ ...base, tool_choice: 'auto' });
  const response = await bridgeResponse(req, events(call, false), { id: 'm', model: 'm', created: 1 }, bridge, () => 'id1');
  const payload = JSON.parse(await response.text());
  expect(payload.choices[0].message.tool_calls).toBeUndefined();
  expect(payload.choices[0].finish_reason).toBe('stop');
  expect(payload.choices[0].message.content).toBe(call);
  const required = parseChatRequest({ ...base, tool_choice: 'required' });
  await expect(bridgeResponse(required, events(call, false), { id: 'm', model: 'm', created: 1 }, bridge, () => 'id1')).rejects.toBeInstanceOf(CapyError);
});

test('outcome reports counts only, never text', async () => {
  const seen: unknown[] = [];
  await bridgeResponse(parseChatRequest({ ...base, tool_choice: 'auto' }), events(call), { id: 'm', model: 'm', created: 1 }, bridge, () => 'id1', (o) => seen.push(o));
  expect(seen).toEqual([{ committed: true, internalTools: false, calls: 1 }]);
  const seen2: unknown[] = [];
  await bridgeResponse(parseChatRequest({ ...base, tool_choice: 'auto' }), events('plain'), { id: 'm', model: 'm', created: 1 }, bridge, () => 'id1', (o) => seen2.push(o));
  expect(seen2).toEqual([{ committed: true, internalTools: false, calls: 0 }]);
});

test('collectReply reports commit state and prefers committed transcript', async () => {
  expect(await collectReply(events('done text'))).toEqual({ text: 'done text', committed: true, internalTools: false });
  expect(await collectReply(events(call, false))).toEqual({ text: call, committed: false, internalTools: false });
});
