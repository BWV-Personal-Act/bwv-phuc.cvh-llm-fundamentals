import { CUSTOMER_SUPPORT_PROMPT } from "../prompts/customer-support.prompt.mjs";
import { TokenMonitor } from "./token-monitor.mjs";

export class ConversationService {
    constructor({ llm, monitor = new TokenMonitor() }) {
        this.llm = llm;
        this.history = [];
        this.monitor = monitor;
    }

    async chat(userMessage) {
        const messages = [
            { role: "system", content: CUSTOMER_SUPPORT_PROMPT },
            ...this.history,
            { role: "user", content: userMessage },
        ];

        const response = await this.llm.complete(messages);
        const usage = this.monitor.record(response.usage);

        const answer = response.choices[0]?.message.content;
        const finishReason = response.choices[0]?.finish_reason;

        if (!answer || finishReason === "length") {
            throw new Error("Model returned an empty or incomplete answer");
        }

        // Chỉ lưu khi đã nhận được câu trả lời hợp lệ
        this.history.push(
            { role: "user", content: userMessage },
            { role: "assistant", content: answer },
        );

        return { answer, usage };
    }

    getStats() {
        return this.monitor.getStats();
    }

    getHistory() {
        return this.history.map((message) => ({ ...message }));
    }

    reset() {
        this.history = [];
    }
}
