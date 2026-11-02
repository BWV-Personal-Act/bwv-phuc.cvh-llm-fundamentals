import { test } from "node:test";
import assert from "node:assert/strict";
import { createLlmService } from "../src/services/llm.service.mjs";

const logger = { info() {}, warn() {}, error() {} };
const retry = { sleepFn: async () => {}, random: () => 0 };
const httpError = (status) => Object.assign(new Error(`HTTP ${status}`), { status });

function make(create) {
  const calls = [];
  const client = { chat: { completions: { create: async (...a) => { calls.push(a); return create(calls.length); } } } };
  return { llm: createLlmService({ client, logger, retry, timeoutMs: 1234 }), calls };
}

test("passes timeout to the request", async () => {
  const { llm, calls } = make(() => ({ choices: [] }));
  await llm.complete([]);
  assert.equal(calls[0][1].timeout, 1234);
});

test("503 is retried 3 times then reported", async () => {
  const { llm, calls } = make(() => { throw httpError(503); });
  await assert.rejects(llm.complete([]), /unavailable \(HTTP 503\)/);
  assert.equal(calls.length, 3);
});

test("429 then success recovers", async () => {
  const { llm, calls } = make((n) => { if (n === 1) throw httpError(429); return { choices: ["ok"] }; });
  assert.deepEqual((await llm.complete([])).choices, ["ok"]);
  assert.equal(calls.length, 2);
});

test("401 and 404 are not retried and have clear messages", async () => {
  for (const [status, re] of [[401, /GROQ_API_KEY/], [404, /not found/]]) {
    const { llm, calls } = make(() => { throw httpError(status); });
    await assert.rejects(llm.complete([]), re);
    assert.equal(calls.length, 1);
  }
});

test("timeout (no status) is retried", async () => {
  const { llm, calls } = make(() => { throw Object.assign(new Error("t"), { name: "APIConnectionTimeoutError" }); });
  await assert.rejects(llm.complete([]), /timed out/);
  assert.equal(calls.length, 3);
});
