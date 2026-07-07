# Discord Game Deals Bot

[English](README.en.md) | [Tiếng Việt](README.vi.md)

![JavaScript](https://img.shields.io/badge/JavaScript-Node.js-F7DF1E?logo=javascript&logoColor=111)
![Discord](https://img.shields.io/badge/Discord-Webhook-5865F2?logo=discord&logoColor=white)
![Steam](https://img.shields.io/badge/Steam-Deals-000000?logo=steam&logoColor=white)
![Epic Games](https://img.shields.io/badge/Epic%20Games-Free%20Games-313131?logo=epicgames&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-Scheduled-2088FF?logo=githubactions&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

A free Discord bot that posts **free games**, **sale events**, and **deep discount deals** from **Epic Games Store** and **Steam**.

It uses **Discord Webhooks** and **GitHub Actions**, so you do not need a VPS, database, Discord bot token, `discord.js`, or a bot running 24/7.

## Project Info

| Item | Value |
| --- | --- |
| Author | Huỳnh Tấn Đạt |
| Source language | JavaScript |
| Runtime | Node.js |
| Module style | CommonJS |
| Automation | GitHub Actions |
| Discord integration | Discord Webhook |

## Is It Free?

With the default setup: **yes, it is free**.

| Component | Cost |
| --- | --- |
| Discord Webhook | Free |
| Node.js | Free |
| Public GitHub repository | Free |
| GitHub Actions twice per day | Free within GitHub limits |
| VPS/database/proxy | Not required |

The default schedule runs every 12 hours and is lightweight. For personal use or a small Discord server, this is effectively **$0**.

## How It Works

```txt
GitHub Actions runs every 12 hours
        ↓
Node.js checks Epic + Steam
        ↓
Filters free games, sale events, and deep discounts
        ↓
Sends Discord embeds through webhooks
        ↓
Updates sent.json to avoid duplicate alerts
```

## Features

- Epic Games Store free game alerts.
- Steam deal alerts.
- Sale event alerts, such as `Steam Summer Sale`.
- Separate Discord webhooks for Epic and Steam.
- Discord embeds with Steam/Epic logos, game images, and event banners when available.
- Duplicate prevention through `src/storage/sent.json`.
- Free scheduled automation through GitHub Actions.
- Safe for public repositories because webhooks are stored in GitHub Secrets.

## Requirements

For local usage:

- Node.js LTS
- Git
- GitHub account
- Discord server with permission to create Webhooks

If you only want scheduled automation, you still need Git to push the source code to GitHub.

## Step 1: Create Discord Channels

Create two Discord channels, for example:

```txt
#epic-alert
#steam-alert
```

You can use one shared channel, but separate channels are easier to read.

## Step 2: Create Discord Webhooks

For each channel:

1. Open `Edit Channel`.
2. Go to `Integrations`.
3. Open `Webhooks`.
4. Click `New Webhook`.
5. Name it, for example `Epic Game Alert` or `Steam Game Alert`.
6. Click `Copy Webhook URL`.

Recommended channel permissions:

```txt
View Channel
Send Messages
Embed Links
Read Message History
Attach Files
```

You do not need to grant `Manage Webhooks` to `@everyone`.

## Step 3: Run Locally

Install dependencies:

```bash
npm install
```

Create `.env` from `.env.example`:

```env
DISCORD_WEBHOOK_URL=optional_fallback_webhook_here
EPIC_DISCORD_WEBHOOK_URL=your_epic_webhook_here
STEAM_DISCORD_WEBHOOK_URL=your_steam_webhook_here
SALE_ALERTS_ENABLED=true
MIN_SALE_DISCOUNT_PERCENT=80
MAX_SALE_ALERTS_PER_PLATFORM=5
```

### Environment Variables

| Variable | Required | Used in | Meaning |
| --- | --- | --- | --- |
| `EPIC_DISCORD_WEBHOOK_URL` | Yes | Local `.env` + GitHub Secrets | Epic channel webhook |
| `STEAM_DISCORD_WEBHOOK_URL` | Yes | Local `.env` + GitHub Secrets | Steam channel webhook |
| `DISCORD_WEBHOOK_URL` | No | Local `.env` + GitHub Secrets | Fallback webhook if you do not split channels |
| `SALE_ALERTS_ENABLED` | No | Local `.env` + GitHub Secrets/Variables | Enable sale alerts, default `true` |
| `MIN_SALE_DISCOUNT_PERCENT` | No | Local `.env` + GitHub Secrets/Variables | Minimum sale discount, default `80` |
| `MAX_SALE_ALERTS_PER_PLATFORM` | No | Local `.env` + GitHub Secrets/Variables | Max deals per platform, default `5` |

Preview what the bot finds without sending Discord messages:

```bash
npm run dry-run
```

Send real Discord alerts:

```bash
npm start
```

Run tests:

```bash
npm test
```

## Step 4: Free Scheduled Deployment With GitHub Actions

Push the source code to a public or private GitHub repository.

Then open:

```txt
Settings
-> Secrets and variables
-> Actions
-> New repository secret
```

Create these secrets:

```txt
EPIC_DISCORD_WEBHOOK_URL
STEAM_DISCORD_WEBHOOK_URL
```

Paste the Epic webhook into `EPIC_DISCORD_WEBHOOK_URL`.

Paste the Steam webhook into `STEAM_DISCORD_WEBHOOK_URL`.

Run it manually:

```txt
Actions
-> Check Free Games
-> Run workflow
```

Default schedule:

```txt
00:00 UTC
12:00 UTC
```

## Sale Configuration

Default:

```env
MIN_SALE_DISCOUNT_PERCENT=80
MAX_SALE_ALERTS_PER_PLATFORM=5
```

Meaning:

```txt
Only send deals with at least 80% discount.
Send at most 5 deals per platform per run.
```

To send more deals:

```env
MIN_SALE_DISCOUNT_PERCENT=70
MAX_SALE_ALERTS_PER_PLATFORM=10
```

Avoid setting the threshold too low, or your Discord channel may get spammed.

## Local vs Deployment

| Mode | Use case | Automatic? |
| --- | --- | --- |
| `npm run dry-run` | Preview data | No |
| `npm start` | Run once on your machine | No |
| GitHub Actions | Free scheduled deployment | Yes, every 12 hours |

If your computer is off, local mode does not run. Use GitHub Actions for free scheduled automation.

## Project Structure

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

## Security

- Do not commit `.env`.
- Discord webhook URLs are secrets.
- Use GitHub Secrets for deployment.
- If a webhook leaks, regenerate it in Discord.

## Data Sources

- Epic: public Epic Games Store endpoint.
- Steam: public Steam Store search/specials.
- Steam events: configured in `src/services/event.service.js`.
- Steam/Epic logos: Simple Icons, built into local PNG files.
- Fallback icons: Google Fonts Icons, built into local PNG files.

## Useful Commands

```bash
npm run build-icons
npm run dry-run
npm test
npm start
```

## Support & Custom Bot Requests

If you want to support the project or request a custom Discord bot, contact the author:

- Author: **Huỳnh Tấn Đạt**
- Facebook: [tan.dat.551987](https://www.facebook.com/tan.dat.551987)

Donation QR:

![Donation QR](assets/support/donation-qr.jpg)

## License

MIT
