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

Free Discord webhook bot for Epic Games Store and Steam free games, sale events, and deep discount alerts.

![Discord Bot Demo](assets/images/demo.png)

## Project Info

| Item | Value |
| --- | --- |
| Author | Huỳnh Tấn Đạt |
| Source language | JavaScript |
| Runtime | Node.js |
| Module style | CommonJS |
| Automation | GitHub Actions |
| Discord integration | Discord Webhook |

## Choose Language

| Language | README |
| --- | --- |
| English | [Read in English](README.en.md) |
| Tiếng Việt | [Đọc bằng tiếng Việt](README.vi.md) |

## Quick Start

```bash
npm install
npm run dry-run
```

Create `.env` from `.env.example`, add your Discord webhooks, then run:

```bash
npm start
```

For automatic free deployment, use GitHub Actions and set these repository secrets:

```txt
EPIC_DISCORD_WEBHOOK_URL
STEAM_DISCORD_WEBHOOK_URL
```

More details:

- [English guide](README.en.md)
- [Hướng dẫn tiếng Việt](README.vi.md)

## FAQ & Features

### How many Steam pages are scanned?
By default, the bot scans `3` pages of Steam search results (about 150 games). You can customize this by setting the `STEAM_PAGES_TO_SCAN` environment variable.

### How does the retry logic work?
If Steam, Epic Store, or Discord webhooks encounter network errors or temporary outages, the bot will automatically retry up to 3 times with exponential backoff. It also handles Discord's 429 rate limit by waiting for the specified `retry-after` header value.

### What is saved in the history log?
The `sent.json` history file now stores detailed objects instead of plain IDs: `{ id, title, platform, sentAt }`. This is backward compatible with old history formats. Sales and event deals older than 30 days are automatically cleaned up to keep the file size minimal.

### How to tag/ping server roles when a new game drops?
Assign `@everyone`, `@here`, or a specific role tag `<@&YOUR_ROLE_ID>` to the `DISCORD_MENTION_ROLE` environment variable. The bot will automatically send the mention along with the game embed.

### How to change the bot's language?
Set `MESSAGE_LOCALE=en` (or `vi` for Vietnamese) in your environment variables. This localizes both the Discord embeds and the CLI console logs.

### Are Steam ratings displayed?
Yes! The bot parses user review summaries (e.g., *Very Positive (88%)*) directly from Steam's search results and displays them as a field in the Discord embed.

### How does message batching work?
To keep Discord channels clean during sales, the bot batches discount deals (`sale`) from the same platform (Steam/Epic) into **a single Discord message with up to 10 Embeds**. Free games, upcoming games, and sale events are still sent as standalone messages for visibility.

### Does the bot support GOG.com free games?
Yes! The bot scans GOG.com catalog for free games. GOG support can be toggled using `ENABLE_GOG`, and you can configure a separate webhook using `GOG_DISCORD_WEBHOOK_URL`.

### How can I filter deals by price and genre?
You can customize your feed by setting the following environment variables:
* `MAX_SALE_PRICE`: Maximum price to receive alerts for sale deals (e.g. `150000` VNĐ).
* `PREFERRED_GENRES`: Preferred game categories (e.g. `Action, RPG`) to restrict alerts to specific tags.
* `EXCLUDED_GENRES`: Genre tags to exclude from alerts (e.g. `Casual, Sports`).

### Does the bot support Ubisoft Connect free games?
Yes! The bot scans Ubisoft Connect giveaways using GamerPower API and sends alerts with the Ubisoft logo. You can configure `UBISOFT_DISCORD_WEBHOOK_URL` for separate alerts and toggle it with `ENABLE_UBISOFT`.

### How can I change the price currency to USD?
Set `CURRENCY_LOCALE=US` in your environment. The bot will fetch prices in USD on Steam/Epic, and `MAX_SALE_PRICE` filters will be evaluated in USD instead of VNĐ.

### Does the bot support free games on Itch.io, IndieGala, Xbox or PlayStation?
Yes! The bot automatically scans other PC freebies using GamerPower API. Alerts are sent with a custom game controller logo (`other.png`). Toggle it with `ENABLE_OTHER_PLATFORMS` and set a custom webhook via `OTHER_DISCORD_WEBHOOK_URL`.

### How do random gaming GIFs work?
To make Discord embeds more fun, the bot randomly attaches a gaming GIF (party, congratulations, win, level up...) on the right side thumbnail for every new free or upcoming game alert.

---

## 🤖 Discord Bot Client (Direct Chat Commands)
To interact directly with the bot on your Discord channel, follow these steps:

### 1. Set Up A Discord Bot Token
1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a **New Application** and go to the **Bot** tab.
3. Under **Privileged Gateway Intents**, enable **MESSAGE CONTENT INTENT** (along with Server Members and Presence intents).
4. Reset and copy the **Bot Token**, then paste it as `DISCORD_BOT_TOKEN=` in your `.env`.
5. Invite the bot to your server using the OAuth2 URL Generator (select `bot` scope and necessary permissions).

### 2. Start the Bot Daemon
Run the listener using:
```bash
npm run discord-bot
```
You can now type commands like `!help`, `!stats`, `!webhooks`, or `!check Portal 2` directly in your Discord channels!

---

## 🛠️ Admin CLI Tools
You can manage your history file, test Webhook health, or interactively write custom embeds using these commands:

* **Show Sent Games History**:
  ```bash
  npm run show-history
  ```
* **Show ASCII Stats Chart**:
  ```bash
  npm run stats-chart
  ```
* **Interactive Custom Message Builder**:
  Walk through a step-by-step console chat format to build and send custom embeds:
  ```bash
  npm run send-custom
  ```
* **Check Discord Webhooks Health**:
  ```bash
  npm run check-webhooks
  ```
* **Send Changelog v1.0.0 Info Embed**:
  ```bash
  npm run send-changelog
  ```
* **Clean Up Sent History (remove sales/events > 30 days old)**:
  ```bash
  npm run clean-history
  ```
* **Reset Sent History (clear sent.json)**:
  ```bash
  npm run reset-history
  ```
* **Check If A Game Has Been Sent**:
  ```bash
  npm run check-game -- "Game Name or ID"
  ```
* **Send A Custom Test Message To Discord**:
  ```bash
  npm run send-test -- "Test Game" "https://store.steampowered.com/" "Steam" "sale"
  ```
  *(Parameters: Name, URL, Platform (default: Steam), Alert Type (default: free))*





## Release Tag v1.0.0
To tag the first official stable release:
```bash
git tag -a v1.0.0 -m "Release v1.0.0 - Network retry & feature upgrades"
git push origin v1.0.0
```


## Author & Support

Author: **Huỳnh Tấn Đạt**

- Facebook: [tan.dat.551987](https://www.facebook.com/tan.dat.551987)
- Donation QR: [View QR](assets/support/donation-qr.jpg)
