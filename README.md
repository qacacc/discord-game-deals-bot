# Discord Game Deals Bot

![JavaScript](https://img.shields.io/badge/JavaScript-Node.js-F7DF1E?logo=javascript&logoColor=111)
![Discord](https://img.shields.io/badge/Discord-Webhook-5865F2?logo=discord&logoColor=white)
![Steam](https://img.shields.io/badge/Steam-Deals-000000?logo=steam&logoColor=white)
![Epic Games](https://img.shields.io/badge/Epic%20Games-Free%20Games-313131?logo=epicgames&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Scheduled-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Bot Discord miễn phí để tự động báo **game free**, **sự kiện sale** và **deal giảm sâu** từ **Epic Games Store** và **Steam** bằng Discord Webhook + GitHub Actions.

Không cần VPS, database, Discord bot token, `discord.js`, hay bot online 24/7.

## Tổng Quan

```txt
GitHub Actions chạy mỗi 12 tiếng
        ↓
Node.js script kiểm tra Epic + Steam
        ↓
Lọc game free, sự kiện sale, deal giảm sâu
        ↓
Gửi embed vào Discord bằng Webhook
        ↓
Ghi sent.json để chống gửi trùng
```

## Tính Năng

- Báo game free từ Epic Games Store.
- Báo game free/deal từ Steam.
- Báo sự kiện sale, ví dụ `Steam Summer Sale`.
- Gửi deal sale mạnh theo ngưỡng giảm giá cấu hình được.
- Tách webhook riêng cho Epic và Steam.
- Embed Discord có logo Steam/Epic, ảnh game và banner event nếu có.
- Chống gửi trùng bằng `src/storage/sent.json`.
- Chạy tự động bằng GitHub Actions.
- Repo public được, không chứa secret.

## Công Nghệ

| Thành phần | Mục đích |
| --- | --- |
| Node.js | Chạy bot |
| Axios | Gọi endpoint Epic/Steam |
| Dotenv | Đọc cấu hình local |
| Discord Webhook | Gửi tin vào Discord |
| GitHub Actions | Tự động chạy theo lịch |
| GitHub Secrets | Lưu webhook an toàn |

## Chuẩn Bị Discord

Tạo 2 channel Discord, ví dụ:

```txt
#epic-alert
#steam-alert
```

Tạo webhook cho từng channel:

1. Bấm bánh răng `Edit Channel`.
2. Vào `Integrations`.
3. Chọn `Webhooks`.
4. Bấm `New Webhook`.
5. Đặt tên, ví dụ `Epic Game Alert` hoặc `Steam Game Alert`.
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

## Cài Đặt Local

Clone repo và cài dependencies:

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

Kiểm tra bot sẽ gửi gì nhưng không gửi Discord:

```bash
npm run dry-run
```

Chạy thật:

```bash
npm start
```

Chạy test:

```bash
npm test
```

## Deploy Bằng GitHub Actions

1. Push source lên GitHub.
2. Vào repo `Settings -> Secrets and variables -> Actions`.
3. Tạo repository secrets:

```txt
EPIC_DISCORD_WEBHOOK_URL
STEAM_DISCORD_WEBHOOK_URL
```

4. Dán webhook Epic vào `EPIC_DISCORD_WEBHOOK_URL`.
5. Dán webhook Steam vào `STEAM_DISCORD_WEBHOOK_URL`.
6. Vào tab `Actions`.
7. Chọn workflow `Check Free Games`.
8. Bấm `Run workflow` để chạy thử.

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

Ý nghĩa:

```txt
Chỉ gửi deal giảm từ 80% trở lên.
Mỗi nền tảng gửi tối đa 5 deal/lần chạy.
```

Muốn nhiều deal hơn:

```env
MIN_SALE_DISCOUNT_PERCENT=70
MAX_SALE_ALERTS_PER_PLATFORM=10
```

Không nên đặt ngưỡng quá thấp vì Discord có thể bị spam.

## Cấu Trúc Project

```txt
src/
├─ services/
│  ├─ discord.service.js
│  ├─ epic.service.js
│  ├─ event.service.js
│  └─ steam.service.js
├─ storage/
│  ├─ sent.json
│  └─ sent.storage.js
├─ assets/icons/
└─ index.js

.github/workflows/check-free-games.yml
```

## Ghi Chú Bảo Mật

- Không commit `.env`.
- Webhook Discord giống mật khẩu, không public.
- Khi deploy, lưu webhook trong GitHub Secrets.
- Nếu webhook từng bị lộ, hãy vào Discord và `Regenerate Webhook URL`.

## Nguồn Dữ Liệu

- Epic: endpoint public của Epic Games Store.
- Steam: Steam Store search/specials public.
- Steam event: lịch seasonal sale trong `src/services/event.service.js`.
- Logo Steam/Epic: Simple Icons, build thành PNG local.
- Icon fallback: Google Fonts Icons, build thành PNG local.

## Lệnh Hữu Ích

```bash
npm run build-icons
npm run dry-run
npm test
npm start
```

## License

MIT
