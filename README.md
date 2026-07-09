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

Discord Game Deals Bot is a Steam/Epic notification project with two clear modes:

| Mode | Purpose | Runs 24/7? |
| --- | --- | --- |
| Webhook / GitHub Actions | Scheduled alerts for event, free games, upcoming free games, and sale deals | No |
| Discord Bot App / Token | Online bot with commands like `!help`, `!search`, `!stats` | Yes |

![Discord Bot Demo](assets/images/demo.png)

> Demo image was captured from a real Discord run. Features are implemented as described in the README; the image is not AI-generated.

## Languages

| Language | README |
| --- | --- |
| English | [README.en.md](README.en.md) |
| Tiếng Việt | [README.vi.md](README.vi.md) |

## Scope

This project is intentionally fixed to two platforms:

- Steam
- Epic Games Store

The core alert types are:

- Sale event alerts
- Event ending reminders before the last 24 hours
- Free game alerts
- Upcoming free Epic game alerts
- Sale deal alerts

## Quick Start

```bash
npm install
npm run dry-run
```

For local webhook testing:

```bash
copy .env.example .env
npm start
```

For free scheduled deployment, use GitHub Actions and set repository secrets/variables as documented in:

- [English guide](README.en.md)
- [Hướng dẫn tiếng Việt](README.vi.md)

## Main Commands

| Command | Meaning |
| --- | --- |
| `npm start` | Run one webhook scan |
| `npm run dry-run` | Preview without sending Discord messages |
| `npm test` | Run test suite |
| `npm run discord-bot` | Run Discord Bot App with token |
| `npm run check-webhooks` | Check configured webhooks |
| `npm run show-history` | Show sent history |

## Language & Currency Customization

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

## Author

Huỳnh Tấn Đạt

## License

MIT
