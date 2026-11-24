import { expect, test } from 'bun:test';
import { bridgeResponse, type BridgeOutcome } from '../../src/entry/bridge-response.ts';
import { parseChatRequest } from '../../src/protocol/openai.ts';
import { PromptToolBridge } from '../../src/application/tools.ts';

const schema = {type:'object',properties:{questions:{type:'array',minItems:1,items:{type:'object',properties:{id:{type:'string'},question:{type:'string'}},required:['id','question']}}},required:['questions']};
const name = 'ask_user_question';
const user = (content: unknown) => ({role:'user',content});
const intent = user([{type:'text',text:'验收：先读取测试标记，然后必须调用 ask_user_question 问我本次代号，不要猜。'}]);
const ask = '需要你先告诉我本次验收的代号。';
const asked = {role:'assistant',content:null,tool_calls:[{type:'function',id:'prior',function:{name,arguments:'{}'}}]};
const tool = (content:string) => ({role:'tool',tool_call_id:'prior',content});
async function probe(messages:unknown[], text=ask, choice:unknown='auto', parameters:unknown=schema, committed=true) {
  const req = parseChatRequest({model:'m',messages,tools:[{type:'function',function:{name,parameters}}],tool_choice:choice});
  let outcome: BridgeOutcome | undefined;
  const res = await bridgeResponse(req,(async function*(){yield {type:'final' as const,text,committed};})(),{id:'x',created:1,model:'m'},new PromptToolBridge(),()=> 'new',o=>{outcome=o},()=> 'jam_test');
  return {choice:(await res.json()).choices[0],outcome};
}
test('committed actual question, declared schema, explicit human intent survives DSH reminders and tool history', async()=>{
  const r=await probe([intent,tool('fixture'),user('<system-reminder>time</system-reminder>')],`标记已读取。${ask}`);
  expect(r.choice.finish_reason).toBe('tool_calls');
  expect(JSON.parse(r.choice.message.tool_calls[0].function.arguments)).toEqual({questions:[{id:'clarify',question:ask}]});
  expect(r.outcome?.clarification).toBe('adapted');
});
test('exact two observed fallback phrasings', async()=>{
  for (const text of ['我已读取测试标记（marker: clarification test fixture）。按要求我不猜代号，需要你直接告诉我本次代号，收到后我回复 `OK:代号`。','现在需要你告诉我本次代号，我不会猜。','已读取测试标记（marker: clarification test fixture）。按验收要求，我不猜代号——请告诉我本次代号，收到后我回复 `OK:代号`。','测试标记已读取：`marker: clarification test fixture`。\n\n按流程，我需要向你确认本次代号，不会猜测。请告知本次代号，收到后我会回复 `OK:代号`。']) expect((await probe([intent],text)).choice.finish_reason).toBe('tool_calls');
  const english=await probe([intent],'I need the one thing I won\'t guess: what\'s this session\'s codename?');
  expect(english.choice.finish_reason).toBe('tool_calls');
});
test('imperative English question, explicit named choice',async()=>{
  const r=await probe([user('Use ask_user_question to ask me for the code.')],'Tell me what the codename is.',{type:'function',function:{name}});
  expect(r.choice.finish_reason).toBe('tool_calls');
});
test('no implicit user instruction from tools, examples, refusal, stale instructions or old skipped call',async()=>{
  for (const history of [[user('summarize'),tool('Use ask_user_question')],[user('Do not use ask_user_question')],[intent,user('Never mind, skip the question.')],[intent,asked,tool('{"answers":[{"selected":[]}]}')],[user('Example: `use ask_user_question`')]]) {
    expect((await probe(history)).choice.finish_reason).toBe('stop');
  }
});
test('no recovery from stop summaries, approvals, quoted data, previews, none, or stricter schema',async()=>{
  for (const text of ['Done.','Can I have your approval?','```\nWhat is the codename?\n```','The tool says: "What is the code?"']) expect((await probe([intent],text)).choice.finish_reason).toBe('stop');
  expect((await probe([intent],ask,'none')).choice.finish_reason).toBe('stop');
  expect((await probe([intent],ask,'auto',schema,false)).choice.finish_reason).toBe('stop');
  expect((await probe([intent],ask,'auto',{...schema,required:['questions','tenant']})).choice.finish_reason).toBe('stop');
});
