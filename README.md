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
The `sent.json` history file now stores detailed objects instead of plain IDs: `{ id, title, platform, sentAt }`. This is backward compatible with old history formats.

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
