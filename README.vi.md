# Discord Game Deals Bot

Bot thông báo game cho Discord, cố định theo 2 kiểu chạy rõ ràng.

## 1. Hai Chế Độ Của Dự Án

| Chế độ | Dùng để làm gì | Có cần online 24/7? |
| --- | --- | --- |
| Webhook / GitHub Actions | Tự động gửi thông báo game theo lịch | Không |
| Discord Bot App / Token | Bot online nhận lệnh trực tiếp trong Discord | Có |

## 2. Phạm Vi Cố Định

Dự án chỉ tập trung vào 2 nền tảng:

- Steam
- Epic Games Store

Các loại thông báo chính:

- Sự kiện sale đang diễn ra.
- Nhắc sự kiện sắp kết thúc trong 24 giờ cuối.
- Game đang miễn phí.
- Game Epic sắp miễn phí.
- Game đang sale.

## 3. Chế Độ Webhook / GitHub Actions

Đây là chế độ miễn phí, không cần máy bạn chạy local.

Workflow chạy file:

```txt
src/index.js
```

Lệnh tương ứng:

```bash
npm start
```

GitHub Actions sẽ:

- Quét Steam/Epic theo lịch.
- Gửi thông báo qua Discord Webhook.
- Ghi lịch sử vào `src/storage/sent.json`.
- Commit lại `sent.json` để không gửi trùng.

### Secrets Cần Thêm

Vào GitHub repo -> `Settings` -> `Secrets and variables` -> `Actions` -> tab `Secrets`.

Thêm:

```txt
DISCORD_WEBHOOK_URL
EPIC_DISCORD_WEBHOOK_URL
STEAM_DISCORD_WEBHOOK_URL
```

`DISCORD_WEBHOOK_URL` là webhook dự phòng. Nếu có riêng Epic và Steam thì bot sẽ ưu tiên webhook riêng.

### Variables Cần Thêm

Qua tab `Variables`, thêm:

```txt
ENABLE_EPIC=true
ENABLE_STEAM=true
ENABLE_FREE_ALERTS=true
ENABLE_UPCOMING_ALERTS=true
ENABLE_EVENT_ALERTS=true
SALE_ALERTS_ENABLED=true
SEND_SALE_DETAILS_TO_DISCORD=true
MIN_SALE_DISCOUNT_PERCENT=80
MAX_SALE_ALERTS_PER_PLATFORM=5
STEAM_PAGES_TO_SCAN=3
CURRENCY_LOCALE=VN
MESSAGE_LOCALE=vi
```

Nếu không muốn gửi từng game sale chi tiết, đổi:

```txt
SEND_SALE_DETAILS_TO_DISCORD=false
```

Khi đó bot vẫn có thể gửi event sale, nhưng không spam danh sách game sale.

### Chạy Trên GitHub

Vào tab `Actions` -> chọn `Check Free Games` -> bấm `Run workflow`.

Không bấm `Re-run jobs` ở workflow cũ nếu bạn vừa cập nhật source.

## 4. Chế Độ Discord Bot App / Token

Chế độ này dùng khi bạn muốn bot hiện online và nhận lệnh trong Discord.

Yêu cầu:

- `DISCORD_BOT_TOKEN`
- Máy/VPS/cloud chạy liên tục

Chạy:

```bash
npm run discord-bot
```

Các lệnh chính:

```txt
!help
!mode
!stats
!webhooks
!check <tên game>
!search <tên game>
!send <tên> | <url> | [nền tảng] | [loại]
!changelog
```

Lưu ý: GitHub Actions không làm bot hiện online. GitHub Actions chỉ gửi tin qua webhook.

## 5. Chạy Local Để Test

```bash
npm install
copy .env.example .env
npm run dry-run
npm start
```

`dry-run` chỉ xem trước, không gửi Discord và không sửa `sent.json`.

## 6. Lịch Sử Chống Gửi Trùng

Bot lưu lịch sử ở:

```txt
src/storage/sent.json
```

Mỗi event/game/sale có ID riêng. Event chính và reminder trước 24 giờ cũng có ID riêng, nên mỗi loại chỉ báo một lần.

## 7. Tùy biến Ngôn ngữ & Tiền tệ

Mặc định, hệ thống xuất thông báo bằng **Tiếng Việt (`vi-VN`)**, múi giờ **`Asia/Ho_Chi_Minh`**, và định dạng tiền tệ theo **Đồng Việt Nam (`₫` / `VND`)**.

Nếu bạn muốn thay đổi ngôn ngữ hoặc đơn vị tiền tệ, bạn có thể tự chỉnh sửa các file mã nguồn sau:

1. **Định dạng Tiền tệ & Giá cả**:
   * File: [search.service.js](file:///c:/Users/PC/Downloads/bot%20game/src/services/search.service.js)
   * Sửa hàm `.toLocaleString("vi-VN")` và ký hiệu tiền tệ `₫` thành locale và ký hiệu bạn muốn (ví dụ: `.toLocaleString("en-US")` và `$` đối với USD).

2. **Định dạng Ngày tháng & Thời gian**:
   * Các file:
     * [event.service.js](file:///c:/Users/PC/Downloads/bot%20game/src/services/event.service.js)
     * [epic.service.js](file:///c:/Users/PC/Downloads/bot%20game/src/services/epic.service.js)
     * [discord.service.js](file:///c:/Users/PC/Downloads/bot%20game/src/services/discord.service.js)
     * [bot.js](file:///c:/Users/PC/Downloads/bot%20game/src/bot.js)
   * Tìm các hàm `Intl.DateTimeFormat("vi-VN", ...)` hoặc `new Date().toLocaleString("vi-VN")` trong các file này và thay thế `"vi-VN"` thành ngôn ngữ đích (ví dụ: `"en-US"`).

## 8. Tác Giả

Huỳnh Tấn Đạt

## 9. License

MIT
