import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const api = await import('../scripts/lib/codex-retirement.mjs').catch(() => ({}));
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'retirement-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const worker = path.join(dir, 'worker.jsonl'), observer = path.join(dir, 'observer.jsonl');
  const rows = [
    { timestamp: '2026-11-06T10:00:00Z', type: 'session_meta', payload: { agent_path: '/root/a', id: 'worker-id', session_id: 'root-session', parent_thread_id: 'observer-id' } },
    { timestamp: '2026-11-06T10:00:01Z', type: 'response_item', payload: { type: 'custom_tool_call', call_id: 'exec1', name: 'exec' } },
    { timestamp: '2026-11-06T10:00:02Z', type: 'response_item', payload: { type: 'custom_tool_call_output', call_id: 'exec1', output: 'Script completed exit_code:0' } },
  ];
  fs.writeFileSync(worker, rows.map(JSON.stringify).join('\n')+'\n');
  fs.writeFileSync(observer, [
    { timestamp: '2026-11-06T10:00:00Z', type:'session_meta',payload:{id:'observer-id',session_id:'root-session'} },
    { timestamp: '2026-11-06T10:00:03Z', type: 'response_item', payload: { type: 'function_call', call_id: 'list1', name: 'list_agents', arguments: '{}' } },
    { timestamp: '2026-11-06T10:00:04Z', type: 'response_item', payload: { type: 'function_call_output', call_id: 'list1', output: JSON.stringify({ agents: [{ agent_name: '/root/a', agent_status: 'interrupted' }] }) } },
  ].map(JSON.stringify).join('\n')+'\n');
  return { workerTrace: worker, observerTrace: observer, observationCallId: 'list1' };
}
test('retirement preserves actual interrupted state, verifies identity, drained calls and unchanged trace', t => {
  assert.equal(typeof api.verifyQuiescence, 'function'); const input = fixture(t);
  const proof = api.verifyQuiescence('/root/a', input);
  assert.equal(proof.hostState, 'interrupted');
  assert.equal(api.verifyRetirement(proof), true);
  assert.throws(() => api.verifyQuiescence('/root/wrong', input), /identity/);
  fs.appendFileSync(input.workerTrace, JSON.stringify({ timestamp: '2026-11-06T10:00:05Z', type: 'response_item', payload: { type: 'custom_tool_call', call_id: 'late', name: 'exec' } })+'\n');
  assert.throws(() => api.verifyRetirement(proof), /changed|activity/);
  assert.throws(() => api.verifyQuiescence('/root/a', input), /pending|observation/i);
});

test('running exec cells block retirement until their actual wait completion', t => {
  const input=fixture(t);
  const rows=[{timestamp:'2026-11-06T10:00:02Z',type:'response_item',payload:{type:'custom_tool_call',call_id:'cell',name:'exec'}},
    {timestamp:'2026-11-06T10:00:02Z',type:'response_item',payload:{type:'custom_tool_call_output',call_id:'cell',output:'Script running with cell ID g5:6'}}];
  fs.appendFileSync(input.workerTrace,rows.map(JSON.stringify).join('\n')+'\n');
  assert.throws(()=>api.verifyQuiescence('/root/a',input),/cell|pending/i);
  fs.appendFileSync(input.workerTrace,[{timestamp:'2026-11-06T10:00:03Z',type:'response_item',payload:{type:'function_call',name:'wait',call_id:'wait-cell',arguments:JSON.stringify({cell_id:'g5:6'})}},
    {timestamp:'2026-11-06T10:00:03Z',type:'response_item',payload:{type:'function_call_output',call_id:'wait-cell',output:'Script completed'}}].map(JSON.stringify).join('\n')+'\n');
  assert.equal(api.verifyQuiescence('/root/a',input).hostState,'interrupted');
});

test('completed shell sessions can retire and observations from other root sessions cannot', t=>{
  const input=fixture(t);
  fs.appendFileSync(input.workerTrace,[{timestamp:'2026-11-06T10:00:02Z',type:'response_item',payload:{type:'function_call',name:'exec_command',call_id:'shell',arguments:'{}'}},
    {timestamp:'2026-11-06T10:00:02Z',type:'response_item',payload:{type:'function_call_output',call_id:'shell',output:'{"session_id":42}'}},
    {timestamp:'2026-11-06T10:00:03Z',type:'response_item',payload:{type:'function_call',name:'write_stdin',call_id:'drain',arguments:'{"session_id":42}'}},
    {timestamp:'2026-11-06T10:00:03Z',type:'response_item',payload:{type:'function_call_output',call_id:'drain',output:'{"exit_code":0}'}}].map(JSON.stringify).join('\n')+'\n');
  assert.equal(api.verifyQuiescence('/root/a',input).hostState,'interrupted');
  fs.writeFileSync(input.observerTrace,fs.readFileSync(input.observerTrace,'utf8').replace('root-session','different-root'));
  assert.throws(()=>api.verifyQuiescence('/root/a',input),/session/i);
});

test('an exec cell waiting on write_stdin resolves its original shell session', t=>{
  const input=fixture(t);
  const rows=[
    {type:'function_call',name:'exec_command',call_id:'launch',arguments:'{}'},
    {type:'function_call_output',call_id:'launch',output:'{"session_id":42}'},
    {type:'custom_tool_call',name:'exec',call_id:'poll',input:'text(await tools.write_stdin({session_id:42}));'},
    {type:'custom_tool_call_output',call_id:'poll',output:'Script running with cell ID g1:2'},
    {type:'function_call',name:'wait',call_id:'wait-poll',arguments:'{"cell_id":"g1:2"}'},
    {type:'function_call_output',call_id:'wait-poll',output:'Script completed {"exit_code":0}'},
  ].map(payload=>({timestamp:'2026-11-06T10:00:03Z',type:'response_item',payload}));
  fs.appendFileSync(input.workerTrace,rows.map(JSON.stringify).join('\n')+'\n');
  assert.equal(api.verifyQuiescence('/root/a',input).hostState,'interrupted');
});

test('opaque nested command output requires an authoritative completed command record',t=>{
  const input=fixture(t);
  fs.appendFileSync(input.workerTrace,[{timestamp:'2026-11-06T10:00:02Z',type:'response_item',payload:{type:'custom_tool_call',name:'exec',call_id:'opaque',input:'await tools.exec_command({cmd:"slow-command"});'}},
    {timestamp:'2026-11-06T10:00:03Z',type:'response_item',payload:{type:'custom_tool_call_output',call_id:'opaque',output:'Script completed'}}].map(JSON.stringify).join('\n')+'\n');
  assert.throws(()=>api.verifyQuiescence('/root/a',input),/opaque|command/i);
  fs.appendFileSync(input.workerTrace,JSON.stringify({timestamp:'2026-11-06T10:00:03Z',type:'event_msg',payload:{type:'item_completed',thread_id:'worker-id',started_at_ms:Date.parse('2026-11-06T10:00:02Z'),item:{type:'CommandExecution',id:'cmd',status:'completed',exit_code:0,process_id:'42'}}})+'\n');
  assert.equal(api.verifyQuiescence('/root/a',input).hostState,'interrupted');
});
test('unfinished command sessions and fabricated observations cannot retire', t => {
  assert.equal(typeof api.verifyQuiescence, 'function'); const input = fixture(t);
  fs.appendFileSync(input.workerTrace, JSON.stringify({ timestamp: '2026-11-06T10:00:02Z', type:'response_item', payload:{ type:'custom_tool_call_output', call_id:'exec1', output:'{"session_id":42}' } })+'\n');
  assert.throws(() => api.verifyQuiescence('/root/a',input), /session/);
  assert.throws(() => api.verifyQuiescence('/root/a',{...input,observationCallId:'invented'}), /observation/);
});
