# Discord Game Deals Bot

![JavaScript](https://img.shields.io/badge/JavaScript-Node.js-F7DF1E?logo=javascript&logoColor=111)
![Discord](https://img.shields.io/badge/Discord-Webhook-5865F2?logo=discord&logoColor=white)
![Steam](https://img.shields.io/badge/Steam-Deals-000000?logo=steam&logoColor=white)
![Epic Games](https://img.shields.io/badge/Epic%20Games-Free%20Games-313131?logo=epicgames&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Scheduled-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

Free Discord webhook bot for Epic Games Store and Steam free games, sale events, and deep discount alerts.

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
