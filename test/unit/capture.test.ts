import { expect, test } from 'bun:test';
import {
  captureInvocation,
  drainInvocations,
  commandOf,
  extractJamId,
  mapInvocationToToolCall,
  stripCapyPreamble,
  COMMAND_HANDLERS,
  CAPTURED_HANDLERS,
} from '../../src/application/capture.ts';
import { bridgeResponse } from '../../src/entry/bridge-response.ts';
import { PromptToolBridge } from '../../src/application/tools.ts';
import { parseChatRequest } from '../../src/protocol/openai.ts';
import type { ToolDefinition } from '../../src/domain/chat.ts';

const tools = [{
  type: 'function' as const,
  function: { name: 'pwsh', parameters: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] } },
}];
const base = { model: 'm', messages: [{ role: 'user', content: 'x' }], tools };

test('capture：记录命令式 handler，commandOf 取命令原文', () => {
  captureInvocation('bash', { command: 'echo $HOME' });
  const items = drainInvocations();
  expect(items.length).toBe(1);
  expect(commandOf(items[0]!)).toBe('echo $HOME');
  expect(drainInvocations().length).toBe(0); // 读完清空
});

test('capture：非命令 handler 不记录（由调用方过滤）', () => {
  expect(COMMAND_HANDLERS.has('bash')).toBe(true);
  expect(COMMAND_HANDLERS.has('read')).toBe(false);
});

test('commandOf：剥掉 pwsh -Command / bash -c 外壳，保留内层脚本与 $', () => {
  const pw = { handler: 'bash', params: { command: 'pwsh -NoProfile -Command "$p = Get-Location; Test-Path $p"' }, at: Date.now() };
  expect(commandOf(pw)).toBe('$p = Get-Location; Test-Path $p');
  const bs = { handler: 'bash', params: { command: "bash -lc 'echo $HOME'" }, at: Date.now() };
  expect(commandOf(bs)).toBe('echo $HOME');
  const plain = { handler: 'bash', params: { command: 'Get-Process | Select-Object Name' }, at: Date.now() };
  expect(commandOf(plain)).toBe('Get-Process | Select-Object Name');
});

async function* events(text: string, committed = true) {
  yield { type: 'final' as const, text, committed };
}

test('方案B：模型没给 <CMD>，但内部发起过 bash，bridge 转成 pwsh 调用', async () => {
  captureInvocation('bash', { command: "$ws='C:\\x'; Test-Path $ws" });
  const req = parseChatRequest({ ...base, tool_choice: 'auto' });
  const res = await bridgeResponse(req, events('命令调用被挡回来了'), { id: 'm', model: 'm', created: 1 }, new PromptToolBridge(), () => 'id1');
  const payload = JSON.parse(await res.text());
  const tc = payload.choices[0].message.tool_calls;
  expect(tc?.length).toBe(1);
  expect(tc[0].function.name).toBe('pwsh');
  expect(JSON.parse(tc[0].function.arguments).command).toBe("$ws='C:\\x'; Test-Path $ws");
});

test('方案B：优先用模型自己的 <CMD>，忽略捕获', async () => {
  captureInvocation('bash', { command: 'inner-cmd' });
  const req = parseChatRequest({ ...base, tool_choice: 'auto' });
  const res = await bridgeResponse(req, events('<CMD>outer-cmd</CMD>'), { id: 'm', model: 'm', created: 1 }, new PromptToolBridge(), () => 'id1');
  const payload = JSON.parse(await res.text());
  expect(JSON.parse(payload.choices[0].message.tool_calls[0].function.arguments).command).toBe('outer-cmd');
});

test('方案B：无捕获、无 <CMD>、无 committed → 不伪造调用', async () => {
  const req = parseChatRequest({ ...base, tool_choice: 'auto' });
  const res = await bridgeResponse(req, events('<CMD>x</CMD>', false), { id: 'm', model: 'm', created: 1 }, new PromptToolBridge(), () => 'id1');
  const payload = JSON.parse(await res.text());
  expect(payload.choices[0].message.tool_calls).toBeUndefined();
});

test('stripCapyPreamble：剥离 co-author shim 前缀保留真实命令，纯初始化头返回空', () => {
  const preamble = [
    '__capy_co_author=""',
    'if [ "${__CAPY_CO_AUTHOR_SHIM__:-0}" != "1" ]; then',
    '  export __CAPY_CO_AUTHOR_SHIM__=1',
    'fi',
    'unset __capy_co_author',
  ].join('\n');
  expect(stripCapyPreamble(preamble)).toBe('');
  expect(stripCapyPreamble(`${preamble}\nGet-ChildItem -Force`)).toBe('Get-ChildItem -Force');
  expect(commandOf({ handler: 'bash', params: { command: `${preamble}\npwsh -Command "echo ok"` }, at: Date.now() })).toBe('echo ok');
});

test('extractJamId 与按 jamId 隔离排空', () => {
  const jamA = 'jam_01ARZ3NDEKTSV4RRFFQ69G5FAV';
  const jamB = 'jam_01ARZ3NDEKTSV4RRFFQ69G5FAW';
  expect(extractJamId(`org_1/${jamA}/ws`)).toBe(jamA);
  expect(extractJamId(undefined, `inv_${jamB}`)).toBe(jamB);

  captureInvocation('bash', { command: 'echo A' }, jamA);
  captureInvocation('bash', { command: 'echo B' }, jamB);
  expect(drainInvocations(jamA).map((i) => i.params.command)).toEqual(['echo A']);
  expect(drainInvocations(jamB).map((i) => i.params.command)).toEqual(['echo B']);
});

test('CAPTURED_HANDLERS 与 mapInvocationToToolCall：多参数 read/write/edit/pwsh 映射及 tool_choice 过滤', () => {
  expect(CAPTURED_HANDLERS.has('read')).toBe(true);
  expect(CAPTURED_HANDLERS.has('write')).toBe(true);
  expect(CAPTURED_HANDLERS.has('edit')).toBe(true);

  const fullTools: ToolDefinition[] = [
    {
      type: 'function',
      function: {
        name: 'pwsh',
        parameters: { type: 'object', properties: { command: { type: 'string' }, description: { type: 'string' } }, required: ['command', 'description'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'read',
        parameters: { type: 'object', properties: { file_path: { type: 'string' }, offset: { type: 'number' }, limit: { type: 'number' } }, required: ['file_path'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'write',
        parameters: { type: 'object', properties: { file_path: { type: 'string' }, content: { type: 'string' } }, required: ['file_path', 'content'] },
      },
    },
    {
      type: 'function',
      function: {
        name: 'edit',
        parameters: {
          type: 'object',
          properties: { file_path: { type: 'string' }, old_string: { type: 'string' }, new_string: { type: 'string' }, replace_all: { type: 'boolean' } },
          required: ['file_path', 'old_string', 'new_string'],
        },
      },
    },
  ];

  const pwshCall = mapInvocationToToolCall({ handler: 'bash', params: { command: 'Get-Location' }, at: Date.now() }, fullTools, 'auto');
  expect(pwshCall).toEqual({ name: 'pwsh', arguments: JSON.stringify({ command: 'Get-Location', description: 'Get-Location' }) });

  const readCall = mapInvocationToToolCall({ handler: 'read', params: { path: 'a.txt', offset: 10, limit: 20 }, at: Date.now() }, fullTools, 'auto');
  expect(readCall).toEqual({ name: 'read', arguments: JSON.stringify({ file_path: 'a.txt', offset: 10, limit: 20 }) });

  const writeCall = mapInvocationToToolCall({ handler: 'write', params: { path: 'b.txt', content: 'hello' }, at: Date.now() }, fullTools, 'auto');
  expect(writeCall).toEqual({ name: 'write', arguments: JSON.stringify({ file_path: 'b.txt', content: 'hello' }) });

  const editCall = mapInvocationToToolCall(
    { handler: 'edit', params: { path: 'c.txt', oldString: 'x', newString: 'y', replaceAll: true }, at: Date.now() },
    fullTools,
    { type: 'function', function: { name: 'edit' } },
  );
  expect(editCall).toEqual({
    name: 'edit',
    arguments: JSON.stringify({ file_path: 'c.txt', old_string: 'x', new_string: 'y', replace_all: true }),
  });

  // 强制指定 edit 时，拒绝截获到的 read 调用
  expect(mapInvocationToToolCall(
    { handler: 'read', params: { path: 'a.txt' }, at: Date.now() },
    fullTools,
    { type: 'function', function: { name: 'edit' } },
  )).toBeNull();
});
