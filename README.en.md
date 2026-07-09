# Discord Game Deals Bot

A Discord game notification project with two clearly separated run modes.

## 1. Run Modes

| Mode | Purpose | Requires 24/7 runtime? |
| --- | --- | --- |
| Webhook / GitHub Actions | Scheduled Discord alerts | No |
| Discord Bot App / Token | Online bot with chat commands | Yes |

## 2. Fixed Scope

The project intentionally focuses on two platforms:

- Steam
- Epic Games Store

Supported alert types:

- Active sale events
- Event ending reminders during the last 24 hours
- Free games
- Upcoming free Epic games
- Sale deals

## 3. Webhook / GitHub Actions Mode

This is the free scheduled mode. Your computer does not need to stay online.

The workflow runs:

```txt
src/index.js
```

Equivalent command:

```bash
npm start
```

GitHub Actions will:

- Scan Steam/Epic on schedule.
- Send Discord webhook alerts.
- Save sent history to `src/storage/sent.json`.
- Commit `sent.json` back to prevent duplicate alerts.

### Required Secrets

Go to GitHub repo -> `Settings` -> `Secrets and variables` -> `Actions` -> `Secrets`.

Add:

```txt
DISCORD_WEBHOOK_URL
EPIC_DISCORD_WEBHOOK_URL
STEAM_DISCORD_WEBHOOK_URL
```

`DISCORD_WEBHOOK_URL` is the fallback webhook. Platform webhooks are preferred when configured.

### Recommended Variables

Go to the `Variables` tab and add:

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

To send sale events but not individual sale deal alerts:

```txt
SEND_SALE_DETAILS_TO_DISCORD=false
```

### Run On GitHub

Open `Actions` -> `Check Free Games` -> `Run workflow`.

Do not use `Re-run jobs` on an old workflow run after updating the source.

## 4. Discord Bot App / Token Mode

Use this mode when you want the bot to appear online and respond to Discord commands.

Requires:

- `DISCORD_BOT_TOKEN`
- A continuously running machine/VPS/cloud instance

Run:

```bash
npm run discord-bot
```

Main commands:

```txt
!help
!mode
!stats
!webhooks
!check <game name>
!search <game name>
!send <title> | <url> | [platform] | [type]
!changelog
```

GitHub Actions does not make the Discord bot appear online. GitHub Actions only sends webhook alerts.

## 5. Local Testing

```bash
npm install
copy .env.example .env
npm run dry-run
npm start
```

`dry-run` previews the scan without sending Discord messages or changing `sent.json`.

## 6. Duplicate Protection

Sent history is stored at:

```txt
src/storage/sent.json
```

Each event/game/sale has a stable ID. The active event alert and the 24-hour ending reminder use separate IDs, so each one is sent only once.

## 7. Language & Currency Customization

By default, the system outputs messages in **Vietnamese (`vi-VN`)**, sets the timezone to **`Asia/Ho_Chi_Minh`**, and formats prices in **Vietnamese Dong (`₫` / `VND`)**.

If you wish to change the language or currency, you can modify the following source files:

1. **Currency and Price Formatting**:
   * File: [search.service.js](file:///c:/Users/PC/Downloads/bot%20game/src/services/search.service.js)
   * Modify the `.toLocaleString("vi-VN")` and the suffix symbol `₫` to your preferred locale and symbol (e.g., `.toLocaleString("en-US")` and `$` for USD).

2. **Date and Time Formatting**:
   * Files:
     * [event.service.js](file:///c:/Users/PC/Downloads/bot%20game/src/services/event.service.js)
     * [epic.service.js](file:///c:/Users/PC/Downloads/bot%20game/src/services/epic.service.js)
     * [discord.service.js](file:///c:/Users/PC/Downloads/bot%20game/src/services/discord.service.js)
     * [bot.js](file:///c:/Users/PC/Downloads/bot%20game/src/bot.js)
   * Locate `Intl.DateTimeFormat("vi-VN", ...)` or `new Date().toLocaleString("vi-VN")` in these files and replace `"vi-VN"` with your target locale (e.g., `"en-US"`).

## 8. Author

Huỳnh Tấn Đạt

## 9. License

MIT
