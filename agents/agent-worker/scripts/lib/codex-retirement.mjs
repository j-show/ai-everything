import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { requireValue } from './validation.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function readTrace(file) {
  requireValue(typeof file === 'string' && path.isAbsolute(file), 'Absolute raw host trace required');
  requireValue(file.endsWith('.jsonl'), 'Raw JSONL host trace required');
  const bytes = fs.readFileSync(file);
  let rows;
  try { rows = bytes.toString('utf8').split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)); }
  catch { throw new Error('Malformed host trace; retirement refused'); }
  return { sha256: hash(bytes), rows };
}

/** Verify quiescence; this does NOT assert that the host thread was deleted. */
export function verifyQuiescence(agentId, input) {
  const worker = readTrace(input.workerTrace), observer = readTrace(input.observerTrace);
  const meta = worker.rows.find(r => r.type === 'session_meta')?.payload;
  const owner = observer.rows.find(r => r.type === 'session_meta')?.payload;
  requireValue(meta?.agent_path === agentId, 'Worker trace identity mismatch');
  requireValue(meta.session_id && owner?.session_id === meta.session_id && owner.id === meta.parent_thread_id,
    'Observer must be the same root session and direct controller thread');
  const created = Date.parse(meta.timestamp ?? worker.rows[0].timestamp);
  if (input.notBefore) requireValue(created >= Date.parse(input.notBefore), 'Worker trace predates reservation');
  if (input.notAfter) requireValue(created <= Date.parse(input.notAfter), 'Worker trace created after binding');
  const call = observer.rows.find(r => r.payload?.type === 'function_call'
    && r.payload.call_id === input.observationCallId && r.payload.name === 'list_agents');
  const result = observer.rows.find(r => r.payload?.type === 'function_call_output' && r.payload.call_id === input.observationCallId);
  requireValue(call && result, 'Actual host list observation call/result required');
  const entry = JSON.parse(result.payload.output).agents?.find(a => a.agent_name === agentId);
  const state = typeof entry?.agent_status === 'object' && entry.agent_status?.completed !== undefined ? 'completed' : entry?.agent_status;
  requireValue(['completed', 'interrupted'].includes(state), 'Host does not attest a quiescent execution');
  const pending = new Set(), cells = new Set(), sessions = new Set(), calls = new Map(), origins=new Map();
  const native=new Map();
  for(const row of worker.rows) {
    const p=row.payload,item=p?.item;
    if(row.type==='event_msg' && p.thread_id===meta.id && item?.type==='CommandExecution') native.set(item.id,{...item,started:p.started_at_ms});
  }
  let last = Date.parse(meta.timestamp ?? worker.rows[0].timestamp);
  for (const row of worker.rows) {
    const at = Date.parse(row.timestamp);
    if (Number.isFinite(at) && at < created) continue;
    if (Number.isFinite(at)) last = Math.max(last, at);
    const p = row.payload;
    if (!p || row.type !== 'response_item') continue;
    if (['function_call', 'custom_tool_call'].includes(p.type)) { pending.add(p.call_id); calls.set(p.call_id,{...p,started:at}); }
    if (['function_call_output', 'custom_tool_call_output'].includes(p.type)) {
      pending.delete(p.call_id);
      const text = String(p.output).replace(/\\+"/g, '"');
      const parent = calls.get(p.call_id); let args = {};
      try { args = JSON.parse(parent?.arguments ?? '{}'); } catch { /* Opaque arguments cannot prove draining. */ }
      const effective=parent?.name==='wait' ? (origins.get(args.cell_id)??parent) : parent;
      const running = text.match(/Script running with cell ID\s+([\w:.-]+)/i);
      if (running) { cells.add(running[1]);origins.set(running[1],effective); }
      requireValue(!/Script running/i.test(text) || running, 'Unknown running exec cell format');
      for (const found of text.matchAll(/["']?session_id["']?\s*:\s*(\d+)/g)) sessions.add(Number(found[1]));
      if (parent?.name === 'wait' && args.cell_id && /Script completed/.test(text) && !running) {cells.delete(args.cell_id);origins.delete(args.cell_id);}
      let effectiveArgs={};try{effectiveArgs=JSON.parse(effective?.arguments??'{}');}catch{}
      let target = effective?.name === 'write_stdin' ? effectiveArgs.session_id : null;
      if (effective?.name === 'exec') {
        const targets = [...String(effective.input).matchAll(/write_stdin\s*\(\s*\{[^}]*?["']?session_id["']?\s*:\s*(\d+)/g)];
        if (targets.length === 1 && !/exec_command\s*\(/.test(effective.input)) target = Number(targets[0][1]);
        const count=[...String(effective.input).matchAll(/exec_command\s*\(/g)].length;
        if(count && !running) {
          const envelopes=[...text.matchAll(/["']?exit_code["']?\s*:\s*(?:null|-?\d+)|["']?session_id["']?\s*:\s*\d+/g)].length;
          const commands=[...native.values()].filter(c=>c.started>=effective.started && c.started<=at && ['completed','failed'].includes(c.status) && Number.isInteger(c.exit_code));
          requireValue(envelopes>=count || commands.length>=count,'Opaque nested command results cannot prove draining');
        }
      }
      if (Number.isInteger(target) && /["']?exit_code["']?\s*:\s*-?\d+/.test(text)
        && !/["']?exit_code["']?\s*:\s*null/.test(text)
        && !/["']?session_id["']?\s*:\s*\d+/.test(text)) sessions.delete(target);
    }
  }
  requireValue(pending.size === 0, 'Pending worker tool calls prevent retirement');
  for(const command of native.values()) {
    requireValue(['completed','failed'].includes(command.status) && Number.isInteger(command.exit_code),'Pending native command execution prevents retirement');
    if(/^\d+$/.test(String(command.process_id))) sessions.delete(Number(command.process_id));
  }
  requireValue(cells.size === 0, 'Pending exec cells prevent retirement');
  requireValue(sessions.size === 0, 'Deferred command sessions require explicit draining; retirement refused');
  const observedAt = Date.parse(result.timestamp);
  requireValue(Number.isFinite(observedAt) && observedAt >= last, 'Host observation predates worker activity; query again');
  return { host: 'codex', agentId, hostState: state, workerTrace: input.workerTrace,
    observerTrace: input.observerTrace, observationCallId: input.observationCallId,
    workerSha256: worker.sha256, rootSessionId:meta.session_id, workerThreadId:meta.id,
    notBefore:input.notBefore,notAfter:input.notAfter,observedAt: result.timestamp, threadDeletionVerified: false };
}

export function findQuiescence(agentId, input) {
  requireValue(typeof input.traceRoot === 'string' && path.isAbsolute(input.traceRoot), 'Absolute Codex trace root required');
  const traces=[];
  function scan(dir) {
    for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      if (entry.isSymbolicLink()) continue;
      const file=path.join(dir,entry.name);
      if (entry.isDirectory()) scan(file);
      else if (entry.name.endsWith('.jsonl')) {
        try {
          const fd=fs.openSync(file,'r');let header=Buffer.alloc(0);
          try {
            while(header.length<8*1024*1024 && !header.includes(10)) {
              const block=Buffer.alloc(16384),count=fs.readSync(fd,block,0,block.length,null);
              if(!count)break;header=Buffer.concat([header,block.subarray(0,count)]);
            }
          } finally {fs.closeSync(fd);}
          const end=header.indexOf(10);if(end<0)continue;
          const first=JSON.parse(header.subarray(0,end).toString('utf8'));
          if(first.type==='session_meta')traces.push({file,meta:first.payload});
        }
        catch { /* In-progress unrelated JSONL is not usable evidence. */ }
      }
    }
  }
  scan(input.traceRoot);
  const workers=traces.filter(t=>t.meta?.agent_path===agentId
    && (!input.notBefore || Date.parse(t.meta.timestamp)>=Date.parse(input.notBefore))
    && (!input.notAfter || Date.parse(t.meta.timestamp)<=Date.parse(input.notAfter)));
  requireValue(workers.length===1,'Worker trace missing or ambiguous; supply explicit evidence');
  const worker=workers[0], candidates=[];
  for (const observer of traces.filter(t=>t.meta?.id===worker.meta.parent_thread_id && t.meta?.session_id===worker.meta.session_id)) {
    for (const row of readTrace(observer.file).rows) {
      const p=row.payload;
      if (p?.type==='function_call' && p.name==='list_agents') candidates.push({workerTrace:worker.file,observerTrace:observer.file,observationCallId:p.call_id,time:row.timestamp});
    }
  }
  for (const candidate of candidates.sort((a,b)=>Date.parse(b.time)-Date.parse(a.time))) {
    try { return verifyQuiescence(agentId,{...input,...candidate}); } catch { /* Seek a matching quiescent observation. */ }
  }
  throw new Error('No matching drained Codex host observation; wait and query the direct controller again');
}

export function verifyRetirement(proof) {
  requireValue(proof?.host === 'codex', 'Codex retirement proof required');
  requireValue(readTrace(proof.workerTrace).sha256 === proof.workerSha256, 'Retired worker trace changed; possible new activity');
  const current = verifyQuiescence(proof.agentId, proof);
  requireValue(current.hostState === proof.hostState, 'Retirement observation changed');
  return true;
}
