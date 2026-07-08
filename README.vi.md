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

![Check Free Games](https://github.com/qacacc/discord-game-deals-bot/actions/workflows/check-free-games.yml/badge.svg)

[English](README.en.md) | [Tiếng Việt](README.vi.md)

Bot Discord báo **game miễn phí**, **sự kiện sale** và **deal giảm sâu** từ **Epic Games Store** + **Steam**.

![Discord Bot Demo](assets/images/demo.png)

> Ảnh minh họa chỉ mang tính chất minh họa. Ảnh được chụp từ một lần sử dụng Discord thực tế, không phải là hình ảnh do AI tạo ra.

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
ENABLE_EPIC=true
ENABLE_STEAM=true
ENABLE_FREE_ALERTS=true
ENABLE_EVENT_ALERTS=true
MIN_SALE_DISCOUNT_PERCENT=80
MAX_SALE_ALERTS_PER_PLATFORM=5
```

### Biến Môi Trường

| Biến | Bắt buộc | Dùng ở đâu | Ý nghĩa |
| --- | --- | --- | --- |
| `EPIC_DISCORD_WEBHOOK_URL` | Có | Local `.env` + GitHub Secrets | Webhook channel Epic (nhận game sale, event, free của Epic) |
| `STEAM_DISCORD_WEBHOOK_URL` | Có | Local `.env` + GitHub Secrets | Webhook channel Steam (nhận game sale, event, free của Steam) |
| `OTHER_DISCORD_WEBHOOK_URL` | Không | Local `.env` + GitHub Secrets | Webhook channel còn lại (GOG, Ubisoft, Itch.io, Xbox, PlayStation...) |
| `DISCORD_WEBHOOK_URL` | Không | Local `.env` + GitHub Secrets | Webhook fallback chung nếu không tách kênh |
| `SALE_ALERTS_ENABLED` | Không | Local `.env` + GitHub Secrets/Variables | Bật/tắt báo sale, mặc định `true` |
| `ENABLE_EPIC` | Không | Local `.env` + GitHub Secrets/Variables | Bật/tắt kiểm tra Epic, mặc định `true` |
| `ENABLE_STEAM` | Không | Local `.env` + GitHub Secrets/Variables | Bật/tắt kiểm tra Steam, mặc định `true` |
| `ENABLE_GOG` | Không | Local `.env` + GitHub Secrets/Variables | Bật/tắt kiểm tra GOG, mặc định `true` |
| `ENABLE_UBISOFT` | Không | Local `.env` + GitHub Secrets/Variables | Bật/tắt kiểm tra Ubisoft Connect, mặc định `true` |
| `ENABLE_FREE_ALERTS` | Không | Local `.env` + GitHub Secrets/Variables | Bật/tắt báo game free, mặc định `true` |
| `ENABLE_UPCOMING_ALERTS` | Không | Local `.env` + GitHub Secrets/Variables | Bật/tắt báo game sắp free của Epic, mặc định `true` |
| `ENABLE_EVENT_ALERTS` | Không | Local `.env` + GitHub Secrets/Variables | Bật/tắt báo event sale, mặc định `true` |
| `MIN_SALE_DISCOUNT_PERCENT` | Không | Local `.env` + GitHub Secrets/Variables | Mức giảm tối thiểu để báo sale, mặc định `80` |
| `MAX_SALE_ALERTS_PER_PLATFORM` | Không | Local `.env` + GitHub Secrets/Variables | Số deal tối đa mỗi nền tảng, mặc định `5` |
| `STEAM_PAGES_TO_SCAN` | Không | Local `.env` + GitHub Secrets/Variables | Số trang tìm kiếm Steam cần quét (mỗi trang 50 game), mặc định `3` |
| `CURRENCY_LOCALE` | Không | Local `.env` + GitHub Secrets/Variables | Cấu hình tiền tệ hiển thị (`VN` - VNĐ hoặc `US` - USD), mặc định `VN` |
| `MAX_SALE_PRICE` | Không | Local `.env` + GitHub Secrets/Variables | Giá tối đa của deal sale muốn nhận thông báo (đơn vị VNĐ hoặc USD tương ứng), mặc định không giới hạn |
| `PREFERRED_GENRES` | Không | Local `.env` + GitHub Secrets/Variables | Thể loại game yêu thích muốn nhận (ví dụ `Action, RPG`), mặc định không lọc |
| `EXCLUDED_GENRES` | Không | Local `.env` + GitHub Secrets/Variables | Thể loại game muốn loại trừ (ví dụ `Hentai, Anime`), mặc định không loại trừ |
| `MESSAGE_LOCALE` | Không | Local `.env` + GitHub Secrets/Variables | Ngôn ngữ hiển thị Embed Discord và logs (`vi` hoặc `en`), mặc định `vi` |
| `DISCORD_MENTION_ROLE` | Không | Local `.env` + GitHub Secrets/Variables | Role cần ping trên Discord (ví dụ: `@everyone`, `@here`, hoặc `<@&id_role>`), mặc định không ping |
| `DISCORD_BOT_TOKEN` | Không | Local `.env` | Token của Discord Bot Gateway để chat và ra lệnh trực tiếp trên Discord |
| `DISCORD_BOT_PREFIX` | Không | Local `.env` | Tiền tố lệnh của Bot Client (mặc định: `!`) |
| `DISCORD_BOT_COOLDOWN_SEC` | Không | Local `.env` | Thời gian cooldown chống spam lệnh trên Discord (mặc định: `5` giây) |
| `DISCORD_BOT_FREE_EVENT_ONLY` | Không | Local `.env` | Chỉ áp dụng cho `npm run discord-bot`: mặc định `true` để Bot Client chỉ tự động báo Steam/Epic event + game free/upcoming free |

Khi chạy local, các biến nằm trong file `.env`. Khi chạy bằng GitHub Actions, các webhook nên nằm trong GitHub Secrets.

---

## 🤖 Cách chạy Discord Bot Client (Chat trực tiếp trên Discord)
Để chat và ra lệnh trực tiếp cho bot trên kênh Discord, bạn hãy thực hiện:

### 1. Tạo Bot Token trên Discord
1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications).
2. Bấm **New Application**, đặt tên cho bot.
3. Vào tab **Bot** (bên trái), kéo xuống phần **Privileged Gateway Intents** và **bật các tùy chọn**:
   * **PRESENCE INTENT**
   * **SERVER MEMBERS INTENT**
   * **MESSAGE CONTENT INTENT** (Quan trọng nhất để bot đọc được lệnh chat).
4. Kéo lên bấm **Reset Token** để lấy mã bảo mật Bot Token.
5. Dán token này vào biến `DISCORD_BOT_TOKEN` trong file `.env`.
6. Sang tab **OAuth2** -> **URL Generator** -> Chọn scope `bot` và các bot permissions: `Read Messages/View Channels`, `Send Messages`, `Embed Links`, `Read Message History`, `Attach Files` -> Copy link ở dưới cùng dán vào trình duyệt để mời bot vào Server Discord của bạn.

### 2. Khởi động bot lắng nghe lệnh chat
Chạy lệnh sau trên terminal của bạn:
```bash
npm run discord-bot
```
Sau đó bạn có thể chat các lệnh trực tiếp trên kênh Discord như: `!help`, `!stats`, `!webhooks`, `!check Portal 2`, v.v.

Mặc định Bot Discord chỉ tự động thông báo:

```txt
Steam event
Epic event
Steam game free
Epic game free
Epic upcoming free
```

Bot Discord sẽ không tự động gửi sale deal chi tiết hoặc nền tảng khác trong chế độ này. Nếu muốn Bot Discord chạy theo toàn bộ cấu hình `.env`, đặt:

```env
DISCORD_BOT_FREE_EVENT_ONLY=false
```

Nói ngắn gọn:

| Giá trị | Ý nghĩa |
| --- | --- |
| `true` | Bot Discord online chỉ tự động gửi Steam/Epic event + game free/upcoming free |
| `false` | Bot Discord online chạy theo toàn bộ cấu hình `.env`, gồm sale detail và nền tảng khác nếu bạn bật |

Kiểm tra chế độ hiện tại ngay trong Discord:

```txt
!mode
```

---

## ⚙️ Các lệnh chạy thông thường khác
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

## FAQ

### Vì sao bot không gửi gì?

Có thể chưa có game/deal mới, hoặc các mục hiện tại đã nằm trong `src/storage/sent.json`.

### Tắt máy thì bot có chạy không?

Chạy local thì không. GitHub Actions vẫn chạy vì workflow chạy trên hạ tầng của GitHub.

### Có dùng một channel Discord duy nhất được không?

Được. Chỉ cần dùng `DISCORD_WEBHOOK_URL`, hoặc đặt cùng một webhook cho Epic và Steam.

### Làm sao để thay đổi số trang quét của Steam?
Bạn cấu hình biến môi trường `STEAM_PAGES_TO_SCAN` trong file `.env` hoặc GitHub Variables. Giá trị mặc định là `3` (quét khoảng 150 game). Tăng số này sẽ quét sâu hơn nhưng có thể tốn thời gian hơn.

### Cơ chế tự động thử lại (Retry) hoạt động như thế nào?
Khi gặp lỗi mạng tạm thời hoặc bị giới hạn băng thông (Rate-limit) bởi Steam/Epic/Discord, bot sẽ tự động tạm dừng và thử lại tối đa 3 lần với thời gian chờ tăng dần (exponential backoff). Nếu là lỗi rate limit từ Discord Webhook, bot sẽ tự động đọc header phản hồi và chờ đúng số giây yêu cầu trước khi gửi lại.

### Thông tin lịch sử gửi game lưu trữ những gì?
Lịch sử lưu trữ trong file `src/storage/sent.json` hiện đã lưu chi tiết hơn gồm: `id` (mã định danh game), `title` (tên game/sự kiện), `platform` (nền tảng Steam/Epic), và `sentAt` (thời điểm gửi). Cấu trúc mới này hoàn toàn tương thích ngược với lịch sử cũ chỉ lưu mảng ID. Các deal giảm giá sale và event đã gửi quá 30 ngày sẽ tự động được dọn dẹp để file lịch sử luôn nhẹ.

### Làm sao để tag/ping tất cả mọi người khi có game mới?
Bạn hãy gán giá trị `@everyone`, `@here` hoặc mã Role ID của server dưới dạng `<@&123456789>` vào biến môi trường `DISCORD_MENTION_ROLE`. Bot sẽ tự động gửi kèm tin nhắn ping này cùng với tin nhắn Embed.

### Làm thế nào để thay đổi ngôn ngữ sang Tiếng Anh?
Bạn chỉ cần đặt biến môi trường `MESSAGE_LOCALE=en`. Bot sẽ tự động chuyển đổi ngôn ngữ của Embed trên Discord và nhật ký bảng logs trong console sang Tiếng Anh.

### Tính năng gom nhóm tin nhắn (Batching) hoạt động thế nào?
Để tránh làm loãng kênh chat Discord khi có quá nhiều game giảm giá cùng lúc, bot sẽ tự động gom các deal giảm giá (`sale`) của cùng một nền tảng (Steam hoặc Epic) vào **một tin nhắn duy nhất chứa tối đa 10 Embeds**. Game miễn phí, game sắp miễn phí và các sự kiện lớn vẫn sẽ được gửi riêng lẻ để tạo sự nổi bật.

### Bot có báo game miễn phí của GOG.com không?
Có. Hệ thống hiện đã được tích hợp nguồn game từ GOG.com. Bot sẽ tự động quét danh sách game miễn phí trên GOG và gửi thông báo kèm logo GOG.png đẹp mắt. Bạn có thể bật/tắt qua biến `ENABLE_GOG` và cấu hình webhook riêng qua `GOG_DISCORD_WEBHOOK_URL`.

### Làm sao để cấu hình lọc game theo Giá và Thể loại ưa thích?
Bạn có thể cấu hình các biến sau trong file `.env` hoặc GitHub Variables:
* `MAX_SALE_PRICE`: Đặt mức giá tối đa (ví dụ `150000` để chỉ nhận các deal sale giá từ 150k đổ xuống).
* `PREFERRED_GENRES`: Nhập các thể loại game yêu thích (ví dụ `RPG, Strategy`) để chỉ nhận tin các game thuộc nhóm này (với Epic và GOG).
* `EXCLUDED_GENRES`: Nhập thể loại muốn bỏ qua (ví dụ `Anime, Casual`) để loại trừ.

### Bot có hỗ trợ game free của Ubisoft Connect không?
Có. Bot tự động quét các đợt phát tặng game miễn phí của Ubisoft Connect thông qua API GamerPower và thông báo kèm logo Ubisoft.png đẹp mắt. Bạn có thể bật/tắt qua `ENABLE_UBISOFT` và cấu hình webhook riêng qua `UBISOFT_DISCORD_WEBHOOK_URL`.

### Làm thế nào để đổi giá tiền sang Đô la Mỹ USD ($)?
Bạn chỉ cần đặt biến môi trường `CURRENCY_LOCALE=US`. Lúc này bot sẽ tự động quét giá theo USD trên Steam và Epic, đồng thời bộ lọc `MAX_SALE_PRICE` cũng sẽ tính theo đơn vị USD thay vì VNĐ.

### Bot có báo game miễn phí của Itch.io, IndieGala, Xbox hay PlayStation không?
Có. Hệ thống tự động quét nguồn game PC free khác thông qua API GamerPower. Các game này sẽ được thông báo kèm logo tay cầm game (`other.png`). Bạn có thể bật/tắt qua `ENABLE_OTHER_PLATFORMS` và cấu hình webhook riêng qua `OTHER_DISCORD_WEBHOOK_URL`.

### Giao diện Discord Embed được thiết kế thế nào?
Embed dùng style gọn, một màu chủ đạo, ưu tiên đen/trắng/xanh. Tin nhắn có logo nền tảng, ảnh game thật nếu nguồn cung cấp, giá, ngày nhận, hạn hết và link mở store.

---

## 🛠️ Bộ công cụ dòng lệnh CLI (Admin Tools)
Bạn có thể ra lệnh, tương tác trò chuyện, và quản lý bot bằng các lệnh CLI trực quan sau trong terminal:

* **Xem bảng lịch sử đã gửi**:
  ```bash
  npm run show-history
  ```
* **Vẽ biểu đồ ASCII phân bổ game theo nền tảng**:
  ```bash
  npm run stats-chart
  ```
* **Trình soạn tin tương tác (Chat-bot Custom Sender)**:
  Bot sẽ trò chuyện hỏi-đáp từng bước một để bạn tự thiết kế và gửi tin nhắn game tùy chọn lên Discord:
  ```bash
  npm run send-custom
  ```
* **Kiểm tra sức khỏe kết nối các Webhook Discord**:
  ```bash
  npm run check-webhooks
  ```
* **Gửi tin nhắn thông báo Changelog nâng cấp v1.0.0**:
  ```bash
  npm run send-changelog
  ```
* **Chủ động dọn dẹp các deal sale cũ quá 30 ngày**:
  ```bash
  npm run clean-history
  ```
* **Reset toàn bộ lịch sử gửi (làm trống sent.json)**:
  ```bash
  npm run reset-history
  ```
* **Kiểm tra xem một game đã được gửi chưa**:
  ```bash
  npm run check-game -- "Tên game hoặc ID"
  ```
* **Gửi tin nhắn test nhanh game tùy chỉnh lên Discord**:
  ```bash
  npm run send-test -- "Tên game test" "https://link-game.com" "Steam" "sale"
  ```
  *(Các tham số tùy chọn: Nền tảng mặc định: Steam, loại alert mặc định: free)*





## Hướng dẫn tạo Release Tag v1.0.0
Khi bot đã chạy ổn định và bạn muốn đánh dấu mốc phiên bản chính thức đầu tiên, hãy chạy các lệnh sau trên terminal của máy tính:

```bash
# Tạo git tag local
git tag -a v1.0.0 -m "Release v1.0.0 - Bản nâng cấp tính năng và sửa lỗi mạng"

# Push tag lên GitHub
git push origin v1.0.0
```
Hoặc bạn có thể truy cập vào giao diện Web GitHub của Repo, chọn **Releases** -> **Create a new release** và chọn tag là `v1.0.0`.


## Ủng Hộ & Liên Hệ Làm Bot Riêng

Nếu bạn muốn ủng hộ project hoặc cần làm bot Discord riêng, có thể liên hệ tác giả:

- Tác giả: **Huỳnh Tấn Đạt**
- Facebook: [tan.dat.551987](https://www.facebook.com/tan.dat.551987)

QR ủng hộ:

![QR ủng hộ](assets/support/donation-qr.jpg)
