// Gateway protocol integration test. The read result and UI answer below are fixtures;
// this tests the actual model response, not the DSH approval dialog.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const schema = { type:'object', required:['questions'], properties:{ questions:{type:'array',items:{type:'object',required:['id','question'],properties:{id:{type:'string'},question:{type:'string'}}}}}};
const body = {model:'capy/particle/particle-1', tools:[{type:'function',function:{name:'ask_user_question',parameters:schema}}],tool_choice:'auto',messages:[
  {role:'user',content:'验收：先读取测试标记，然后必须调用 ask_user_question 问我本次代号，不要猜。收到代号后回复 OK:代号。'},
  {role:'assistant',content:null,tool_calls:[{id:'call_fixture',type:'function',function:{name:'read',arguments:'{"file_path":"marker"}'}}]},
  {role:'tool',tool_call_id:'call_fixture',content:'marker: clarification test fixture'}]};
async function post() {
  const r = await fetch('http://127.0.0.1:3425/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(120000)});
  assert.equal(r.status,200);return (await r.json()).choices[0];
}
const first=await post();console.log('first:',first.finish_reason,first.message.content ?? '');assert.equal(first.finish_reason,'tool_calls');assert.equal(first.message.tool_calls.length,1);
const [call]=first.message.tool_calls;assert.equal(call.function.name,'ask_user_question');assert.ok(call.id);
const {questions}=JSON.parse(call.function.arguments);assert.equal(questions.length,1);assert.ok(questions[0].id);assert.match(questions[0].question,/代号|code\s?name/i);
const code='TEST-'+randomUUID().slice(0,8);body.messages.push(first.message,{role:'tool',tool_call_id:call.id,content:JSON.stringify({answers:[{id:questions[0].id,custom:code}]})});
const second=await post();console.log('call:',call.id,'question:',questions[0].question,'resume:',second.finish_reason,second.message.content);assert.equal(second.finish_reason,'stop');assert.ok(second.message.content.includes(code));
