const assert = require("node:assert/strict");
const test = require("node:test");

const { getWebhookUrl } = require("../src/services/discord.service");

test("chon webhook rieng theo nen tang", () => {
  const oldEpic = process.env.EPIC_DISCORD_WEBHOOK_URL;
  const oldSteam = process.env.STEAM_DISCORD_WEBHOOK_URL;
  const oldFallback = process.env.DISCORD_WEBHOOK_URL;

  process.env.EPIC_DISCORD_WEBHOOK_URL = "https://example.com/epic";
  process.env.STEAM_DISCORD_WEBHOOK_URL = "https://example.com/steam";
  process.env.DISCORD_WEBHOOK_URL = "https://example.com/fallback";

  assert.equal(getWebhookUrl({ platform: "Epic Games Store" }), "https://example.com/epic");
  assert.equal(getWebhookUrl({ platform: "Steam" }), "https://example.com/steam");
  assert.equal(getWebhookUrl({ platform: "Other" }), "https://example.com/fallback");

  process.env.EPIC_DISCORD_WEBHOOK_URL = oldEpic;
  process.env.STEAM_DISCORD_WEBHOOK_URL = oldSteam;
  process.env.DISCORD_WEBHOOK_URL = oldFallback;
});
