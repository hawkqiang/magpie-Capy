import { expect, test } from 'bun:test';
import { buildPrompt, type ChatMessage } from '../../src/domain/chat.ts';

const instruction = 'Declared tools: read';
function history(): ChatMessage[] {
  const messages: ChatMessage[] = [{role:'user', content:'Fix the failing tests.'}];
  for (let i=0; i<40; ++i) messages.push(
    {role:'assistant',content:'',toolCalls:[{id:`c${i}`,name:'read',arguments:'{"file_path":"example.ts"}'}]},
    {role:'tool',content:'same lines',toolCallId:`c${i}`});
  return messages;
}
test('long tool replay ends with next-action guidance and flags repeated successful reads', () => {
  const prompt = buildPrompt(history(), {toolInstruction:instruction});
  expect(prompt).toContain('A plan alone ends the client turn');
  expect(prompt).toContain('same read');
  expect(prompt).toContain('id="c39"');
});
test('new user question or disabled tools gets no continuation cue', () => {
  expect(buildPrompt([...history(),{role:'user',content:'Just summarize.'}],{toolInstruction:instruction})).not.toContain('A plan alone');
  expect(buildPrompt(history())).not.toContain('A plan alone');
});
