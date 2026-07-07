# Discord Free Game & Sale Alert Bot

Bot Node.js miễn phí dùng GitHub Actions để tự động báo game miễn phí, sự kiện sale và deal giảm sâu từ Epic Games Store + Steam vào Discord bằng Webhook.

## Tính Năng

- Báo game free từ Epic Games Store và Steam.
- Báo sự kiện sale, ví dụ Steam Summer Sale.
- Báo game sale mạnh theo ngưỡng giảm giá cấu hình được.
- Tách webhook riêng cho kênh Epic và kênh Steam.
- Chống gửi trùng bằng `src/storage/sent.json`.
- Chạy tự động 12 tiếng/lần bằng GitHub Actions.
- Không cần VPS, database, Discord bot token hoặc `discord.js`.

## Chuẩn Bị Discord

Tạo 2 channel Discord, ví dụ:

```txt
#epic-alert
#steam-alert
```

Với mỗi channel:

1. Bấm bánh răng `Edit Channel`.
2. Vào `Integrations`.
3. Chọn `Webhooks`.
4. Bấm `New Webhook`.
5. Đặt tên webhook, ví dụ `Epic Game Alert` hoặc `Steam Game Alert`.
6. Bấm `Copy Webhook URL`.

Quyền channel nên bật:

```txt
View Channel
Send Messages
Embed Links
Read Message History
Attach Files
```

Không cần bật `Manage Webhooks` cho `@everyone`.

## Chạy Local

Clone project rồi cài dependencies:

```bash
npm install
```

Tạo file `.env` từ `.env.example`:

```env
DISCORD_WEBHOOK_URL=optional_fallback_webhook_here
EPIC_DISCORD_WEBHOOK_URL=your_epic_webhook_here
STEAM_DISCORD_WEBHOOK_URL=your_steam_webhook_here
SALE_ALERTS_ENABLED=true
MIN_SALE_DISCOUNT_PERCENT=80
MAX_SALE_ALERTS_PER_PLATFORM=5
```

Kiểm tra bot lấy được gì nhưng không gửi Discord:

```bash
npm run dry-run
```

Chạy thật:

```bash
npm start
```

Chạy test code:

```bash
npm test
```

## Deploy Bằng GitHub Actions

1. Tạo repo GitHub public hoặc private.
2. Push source lên GitHub.
3. Vào repo `Settings -> Secrets and variables -> Actions`.
4. Tạo 2 repository secrets:

```txt
EPIC_DISCORD_WEBHOOK_URL
STEAM_DISCORD_WEBHOOK_URL
```

5. Dán webhook Epic vào `EPIC_DISCORD_WEBHOOK_URL`.
6. Dán webhook Steam vào `STEAM_DISCORD_WEBHOOK_URL`.
7. Vào tab `Actions`.
8. Chọn workflow `Check Free Games`.
9. Bấm `Run workflow` để test.

Workflow tự chạy lúc:

```txt
00:00 UTC
12:00 UTC
```

Tương đương khoảng:

```txt
07:00 Việt Nam
19:00 Việt Nam
```

## Cấu Hình Sale

Mặc định:

```env
MIN_SALE_DISCOUNT_PERCENT=80
MAX_SALE_ALERTS_PER_PLATFORM=5
```

Nghĩa là bot chỉ gửi game giảm từ 80% trở lên và tối đa 5 game mỗi nền tảng trong một lần chạy.

Muốn nhiều deal hơn:

```env
MIN_SALE_DISCOUNT_PERCENT=70
MAX_SALE_ALERTS_PER_PLATFORM=10
```

Không nên để quá thấp vì Discord sẽ bị spam.

## Ghi Chú

- `.env` không được commit lên GitHub.
- `sent.json` được GitHub Actions commit lại sau mỗi lần có tin mới để chống gửi trùng.
- Steam chỉ lấy game sale/free từ store search public.
- Epic lấy dữ liệu từ endpoint public của Epic Games Store.
- Logo Steam/Epic dùng Simple Icons và được build thành PNG local.
- Icon fallback dùng Google Fonts Icons.
- Bot chỉ gửi link web vì Discord không render ổn định deep link mở app như `steam://...`.

## Lệnh Hữu Ích

```bash
npm run build-icons
npm run dry-run
npm test
npm start
```
