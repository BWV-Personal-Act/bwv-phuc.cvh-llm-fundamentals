# Customer Support CLI Assistant – V1

CLI chat dùng Groq API (`openai/gpt-oss-120b`) đóng vai nhân viên Customer Support.

## Cài đặt

Yêu cầu Node.js >= 20.6.

```bash
npm install
cp .env.example .env   # điền GROQ_API_KEY
npm start
npm test
```

## Lệnh

| Lệnh | Mô tả |
|---|---|
| `/reset` | Xóa lịch sử hội thoại |
| `/stats` | Số request, input/output tokens, chi phí ước tính |
| `/history` | Xem lịch sử |
| `/exit` | Thoát |

## Kiến trúc

- `src/prompts/` – system prompt Customer Support
- `src/services/llm.service.mjs` – gọi Groq: timeout (15s), retry, map lỗi 401/404/429/5xx
- `src/services/conversation.service.mjs` – lịch sử multi-turn, reset
- `src/services/token-monitor.mjs` – tokens + chi phí (giá $0.15 / $0.60 mỗi 1M tokens input/output)
- `src/utils/retry.mjs` – exponential backoff + full jitter, tối đa 3 attempts; chỉ retry 429, 5xx, timeout/lỗi mạng
- `src/utils/logger.mjs` – structured log (JSON line) ra **stderr**: `llm.request`, `llm.response`, `llm.retry`, `llm.failed`

Xem log riêng: `npm start 2> app.log`.

## Ghi chú

- Dùng JavaScript (`.mjs`) thay vì TypeScript để không cần bước build.
- Giá trong `token-monitor.mjs` là ước tính, kiểm tra lại bảng giá Groq khi cần.
