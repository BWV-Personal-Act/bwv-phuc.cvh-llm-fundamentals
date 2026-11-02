import { test } from "node:test";
import assert from "node:assert/strict";
import { withRetry } from "../src/utils/retry.mjs";

const fast = { sleepFn: async () => {}, random: () => 1 };

test("returns result without retry on success", async () => {
  assert.equal(await withRetry(async () => "ok", fast), "ok");
});

test("retries then succeeds", async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    if (++calls < 3) throw new Error("boom");
    return "ok";
  }, fast);
  assert.equal(result, "ok");
  assert.equal(calls, 3);
});

test("gives up after maxAttempts and throws last error", async () => {
  let calls = 0;
  await assert.rejects(withRetry(async () => { calls++; throw new Error("down"); }, fast), /down/);
  assert.equal(calls, 3);
});

test("does not retry non-retryable errors", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(async () => { calls++; throw new Error("x"); }, { ...fast, isRetryable: () => false }),
  );
  assert.equal(calls, 1);
});

test("backoff is exponential and jitter is bounded", async () => {
  const delays = [];
  await assert.rejects(withRetry(async () => { throw new Error("x"); }, {
    ...fast, baseMs: 100, maxAttempts: 4, onRetry: (e) => delays.push(e.delayMs),
  }));
  assert.deepEqual(delays, [100, 200, 400]);

  const jittered = [];
  await assert.rejects(withRetry(async () => { throw new Error("x"); }, {
    ...fast, baseMs: 100, random: () => 0.5, onRetry: (e) => jittered.push(e.delayMs),
  }));
  assert.deepEqual(jittered, [50, 100]);
});
