export class TokenMonitor {
  constructor() {
    this.stats = {
      requests: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cachedTokens: 0,
      estimatedCost: 0,
    };
  }

  record(usage) {
    if (!usage) return;

    const promptTokens = usage.prompt_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? 0;

    const cachedTokens = Math.min(
      usage.prompt_tokens_details?.cached_tokens ?? 0,
      promptTokens
    );

    const uncachedTokens = promptTokens - cachedTokens;

    const INPUT_PRICE = 0.15;
    const CACHED_INPUT_PRICE = 0.075;
    const OUTPUT_PRICE = 0.60;

    const estimatedCost =
      (
        uncachedTokens * INPUT_PRICE +
        cachedTokens * CACHED_INPUT_PRICE +
        completionTokens * OUTPUT_PRICE
      ) / 1_000_000;

    this.stats.requests++;
    this.stats.promptTokens += promptTokens;
    this.stats.completionTokens += completionTokens;
    this.stats.totalTokens += usage.total_tokens
      ?? promptTokens + completionTokens;
    this.stats.cachedTokens += cachedTokens;
    this.stats.estimatedCost += estimatedCost;

    return {
      promptTokens,
      completionTokens,
      cachedTokens,
      estimatedCost,
    };
  }

  getStats() {
    return { ...this.stats };
  }
}