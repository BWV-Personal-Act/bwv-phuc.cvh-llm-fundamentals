import { test } from "node:test";
import assert from "node:assert/strict";
import { ConversationService } from "../src/services/conversation.service.mjs";
import { TokenMonitor } from "../src/services/token-monitor.mjs";

const reply = (content, finish_reason = "stop") => ({
  choices: [{ message: { content }, finish_reason }],
  usage: { prompt_tokens: 1000, completion_tokens: 1000, total_tokens: 2000 },
});

function make(...replies) {
  const sent = [];
  const llm = { complete: async (m) => { sent.push(structuredClone(m)); return replies.shift(); } };
  return { svc: new ConversationService({ llm }), sent };
}

test("multi-turn: second request carries previous turns", async () => {
  const { svc, sent } = make(reply("a1"), reply("a2"));
  await svc.chat("q1");
  await svc.chat("q2");
  assert.deepEqual(sent[1].map((m) => m.content).slice(1), ["q1", "a1", "q2"]);
  assert.equal(sent[1][0].role, "system");
});

test("reset clears history", async () => {
  const { svc, sent } = make(reply("a1"), reply("a2"));
  await svc.chat("q1");
  svc.reset();
  await svc.chat("q2");
  assert.equal(sent[1].length, 2);
});

test("truncated answer is rejected and not stored", async () => {
  const { svc } = make(reply("cut", "length"));
  await assert.rejects(svc.chat("q"), /incomplete/);
  assert.equal(svc.getHistory().length, 0);
});

test("token monitor accumulates and estimates cost", async () => {
  const { svc } = make(reply("a"), reply("b"));
  await svc.chat("q1");
  await svc.chat("q2");
  const s = svc.getStats();
  assert.equal(s.requests, 2);
  assert.equal(s.totalTokens, 4000);
  assert.ok(Math.abs(s.estimatedCost - 0.0015) < 1e-9); // 2*(1000*0.15 + 1000*0.60)/1e6
});

test("TokenMonitor ignores missing usage", () => {
  const m = new TokenMonitor();
  m.record(undefined);
  assert.equal(m.getStats().requests, 0);
});
