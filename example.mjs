import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const response = await client.chat.completions.create({
  model: "openai/gpt-oss-120b",
  messages: [
    {
      role: "system",
      content: `
        Classify customer messages into:
        ORDER_STATUS, REFUND, CANCEL_ORDER, OTHER.

        Examples:

        Input: Đơn hàng của tôi đang ở đâu?
        Output: ORDER_STATUS

        Input: Tôi muốn hoàn tiền.
        Output: REFUND

        Input: Hủy đơn hàng #456 giúp tôi.
        Output: CANCEL_ORDER

        Return only the category.
      `,
    },
    {
      role: "user",
      content: "Tôi không muốn mua nữa, hủy giúp tôi.",
    },
  ],
});

console.log(response.choices[0].message.content);