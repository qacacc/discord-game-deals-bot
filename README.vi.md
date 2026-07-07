<h1 align="center">
  <img src="https://img.shields.io/badge/Discord-Game%20Deals%20Bot-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord Game Deals Bot">
</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-181717?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/JavaScript-181717?style=for-the-badge&logo=javascript&logoColor=white" alt="JavaScript">
  <img src="https://img.shields.io/badge/Steam-181717?style=for-the-badge&logo=steam&logoColor=white" alt="Steam">
  <img src="https://img.shields.io/badge/Epic%20Games-181717?style=for-the-badge&logo=epicgames&logoColor=white" alt="Epic Games">
  <img src="https://img.shields.io/badge/GitHub%20Actions-181717?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions">
</p>

[English](README.en.md) | [Tiếng Việt](README.vi.md)

Bot Discord báo **game miễn phí**, **sự kiện sale** và **deal giảm sâu** từ **Epic Games Store** + **Steam**.

Bot dùng **Discord Webhook** và **GitHub Actions**, nên không cần VPS, database, Discord bot token, `discord.js`, hay bot online 24/7.

## Thông Tin Project

| Mục | Giá trị |
| --- | --- |
| Tác giả | Huỳnh Tấn Đạt |
| Ngôn ngữ source | JavaScript |
| Runtime | Node.js |
| Kiểu module | CommonJS |
| Tự động hóa | GitHub Actions |
| Kết nối Discord | Discord Webhook |

## Có Tốn Tiền Không?

Với cách dùng mặc định: **không tốn tiền**.

| Thành phần | Chi phí |
| --- | --- |
| Discord Webhook | Miễn phí |
| Node.js | Miễn phí |
| GitHub repo public | Miễn phí |
| GitHub Actions chạy 2 lần/ngày | Miễn phí trong giới hạn GitHub |
| VPS/database/proxy | Không cần |

Bot mặc định chạy mỗi 12 tiếng, rất nhẹ. Với nhu cầu cá nhân hoặc server nhỏ, gần như dùng **0 đồng**.

## Bot Làm Gì?

```txt
GitHub Actions chạy mỗi 12 tiếng
        ↓
Bot kiểm tra Epic + Steam
        ↓
Lọc game free, sale event, deal giảm sâu
        ↓
Gửi embed vào Discord
        ↓
Lưu sent.json để không gửi trùng
```

## Tính Năng

- Báo game free từ Epic Games Store.
- Báo deal từ Steam.
- Báo sự kiện sale, ví dụ `Steam Summer Sale`.
- Tách webhook riêng cho kênh Epic và kênh Steam.
- Có logo Steam/Epic, ảnh game và banner event nếu có.
- Chống gửi trùng bằng `src/storage/sent.json`.
- Chạy tự động bằng GitHub Actions.
- Public repo an toàn vì webhook nằm trong GitHub Secrets.

## Cần Chuẩn Bị

Cài trên máy nếu muốn chạy local:

- Node.js LTS
- Git
- Tài khoản GitHub
- Server Discord có quyền tạo Webhook

Nếu chỉ muốn chạy tự động trên GitHub, bạn vẫn cần Git để push source lên repo.

## Bước 1: Tạo Channel Discord

Tạo 2 channel, ví dụ:

```txt
#epic-alert
#steam-alert
```

Bạn có thể dùng 1 channel chung cũng được, nhưng khuyên tách riêng để dễ xem.

## Bước 2: Tạo Webhook Discord

Làm cho từng channel:

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

## Bước 3: Chạy Local

Cài dependencies:

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

### Biến Môi Trường

| Biến | Bắt buộc | Dùng ở đâu | Ý nghĩa |
| --- | --- | --- | --- |
| `EPIC_DISCORD_WEBHOOK_URL` | Có | Local `.env` + GitHub Secrets | Webhook channel Epic |
| `STEAM_DISCORD_WEBHOOK_URL` | Có | Local `.env` + GitHub Secrets | Webhook channel Steam |
| `DISCORD_WEBHOOK_URL` | Không | Local `.env` + GitHub Secrets | Webhook fallback nếu không tách kênh |
| `SALE_ALERTS_ENABLED` | Không | Local `.env` + GitHub Secrets/Variables | Bật/tắt báo sale, mặc định `true` |
| `MIN_SALE_DISCOUNT_PERCENT` | Không | Local `.env` + GitHub Secrets/Variables | Mức giảm tối thiểu để báo sale, mặc định `80` |
| `MAX_SALE_ALERTS_PER_PLATFORM` | Không | Local `.env` + GitHub Secrets/Variables | Số deal tối đa mỗi nền tảng, mặc định `5` |

Khi chạy local, các biến nằm trong file `.env`. Khi chạy bằng GitHub Actions, các webhook nên nằm trong GitHub Secrets.

Kiểm tra bot tìm được gì nhưng chưa gửi Discord:

```bash
npm run dry-run
```

Gửi thật vào Discord:

```bash
npm start
```

Chạy test code:

```bash
npm test
```

## Bước 4: Chạy Tự Động Miễn Phí Bằng GitHub Actions

Push source lên GitHub public/private repo.

Sau đó vào GitHub repo:

```txt
Settings
-> Secrets and variables
-> Actions
-> New repository secret
```

Tạo 2 secret:

```txt
EPIC_DISCORD_WEBHOOK_URL
STEAM_DISCORD_WEBHOOK_URL
```

Dán webhook Epic vào `EPIC_DISCORD_WEBHOOK_URL`.

Dán webhook Steam vào `STEAM_DISCORD_WEBHOOK_URL`.

Chạy thử:

```txt
Actions
-> Check Free Games
-> Run workflow
```

Workflow mặc định tự chạy:

```txt
00:00 UTC
12:00 UTC
```

Ở Việt Nam khoảng:

```txt
07:00 sáng
19:00 tối
```

## Cấu Hình Sale

Mặc định:

```env
MIN_SALE_DISCOUNT_PERCENT=80
MAX_SALE_ALERTS_PER_PLATFORM=5
```

Nghĩa là:

```txt
Chỉ gửi deal giảm từ 80% trở lên.
Mỗi nền tảng gửi tối đa 5 deal trong một lần chạy.
```

Muốn bot gửi nhiều deal hơn:

```env
MIN_SALE_DISCOUNT_PERCENT=70
MAX_SALE_ALERTS_PER_PLATFORM=10
```

Không nên để ngưỡng quá thấp vì Discord sẽ bị spam.

## Local Và Deploy Khác Gì Nhau?

| Cách chạy | Dùng khi nào | Có tự động không? |
| --- | --- | --- |
| `npm run dry-run` | Kiểm tra dữ liệu | Không |
| `npm start` | Chạy thật trên máy bạn | Không |
| GitHub Actions | Deploy miễn phí | Có, mỗi 12 tiếng |

Nếu tắt máy, local sẽ không tự chạy. Muốn tự động 24/7 miễn phí thì dùng GitHub Actions.

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

## Bảo Mật

- Không commit `.env`.
- Webhook Discord giống mật khẩu.
- Luôn dùng GitHub Secrets khi deploy.
- Nếu webhook bị lộ, vào Discord và `Regenerate Webhook URL`.

## Nguồn Dữ Liệu

- Epic: endpoint public của Epic Games Store.
- Steam: Steam Store search/specials public.
- Steam event: cấu hình trong `src/services/event.service.js`.
- Logo Steam/Epic: Simple Icons, build thành PNG local.
- Icon fallback: Google Fonts Icons, build thành PNG local.

## Lệnh Hữu Ích

```bash
npm run build-icons
npm run dry-run
npm test
npm start
```

## Ủng Hộ & Liên Hệ Làm Bot Riêng

Nếu bạn muốn ủng hộ project hoặc cần làm bot Discord riêng, có thể liên hệ tác giả:

- Tác giả: **Huỳnh Tấn Đạt**
- Facebook: [tan.dat.551987](https://www.facebook.com/tan.dat.551987)

QR ủng hộ:

![QR ủng hộ](assets/support/donation-qr.jpg)
