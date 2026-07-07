require("dotenv").config({ quiet: true });

const { getEpicFreeGames, getEpicSaleGames } = require("./services/epic.service");
const { getSteamFreeGames, getSteamSaleGames } = require("./services/steam.service");
const { getActiveSaleEvents } = require("./services/event.service");
const { sendGameEmbed } = require("./services/discord.service");
const { normalizeGame } = require("./utils/formatGame");

const {
  loadSentGames,
  saveSentGames,
  isGameSent,
  markGameAsSent,
} = require("./storage/sent.storage");

function readBooleanEnv(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function readNumberEnv(name, defaultValue) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

async function runChecker({
  getEpicGames = getEpicFreeGames,
  getSteamGames = getSteamFreeGames,
  getEpicSales = getEpicSaleGames,
  getSteamSales = getSteamSaleGames,
  getSaleEvents = getActiveSaleEvents,
  sendGame = sendGameEmbed,
  loadSent = loadSentGames,
  saveSent = saveSentGames,
  dryRun = false,
  epicEnabled = readBooleanEnv("ENABLE_EPIC", true),
  steamEnabled = readBooleanEnv("ENABLE_STEAM", true),
  freeAlertsEnabled = readBooleanEnv("ENABLE_FREE_ALERTS", true),
  eventAlertsEnabled = readBooleanEnv("ENABLE_EVENT_ALERTS", true),
  saleAlertsEnabled = readBooleanEnv("SALE_ALERTS_ENABLED", true),
  minSaleDiscountPercent = readNumberEnv("MIN_SALE_DISCOUNT_PERCENT", 80),
  maxSaleAlertsPerPlatform = readNumberEnv("MAX_SALE_ALERTS_PER_PLATFORM", 5),
} = {}) {
  console.log("Checking free games and sale alerts...");

  const sentData = loadSent();
  const epicGames = epicEnabled && freeAlertsEnabled ? await getEpicGames() : [];
  const steamGames = steamEnabled && freeAlertsEnabled ? await getSteamGames() : [];
  const epicSales = epicEnabled && saleAlertsEnabled
    ? await getEpicSales({
        minDiscountPercent: minSaleDiscountPercent,
        limit: maxSaleAlertsPerPlatform,
      })
    : [];
  const steamSales = steamEnabled && saleAlertsEnabled
    ? await getSteamSales({
        minDiscountPercent: minSaleDiscountPercent,
        limit: maxSaleAlertsPerPlatform,
      })
    : [];
  const saleEvents = eventAlertsEnabled && saleAlertsEnabled
    ? getSaleEvents({
        steamSales,
        epicSales,
      })
    : [];

  const allGames = [...epicGames, ...steamGames, ...saleEvents, ...epicSales, ...steamSales].map(
    normalizeGame,
  );
  const newGames = allGames.filter((game) => !isGameSent(game.id, sentData));
  const duplicateCount = allGames.length - newGames.length;
  const summary = {
    checked: allGames.length,
    duplicates: duplicateCount,
    epicFree: epicGames.length,
    steamFree: steamGames.length,
    events: saleEvents.length,
    epicSales: epicSales.length,
    steamSales: steamSales.length,
  };

  if (newGames.length === 0) {
    console.log("No new games or sale alerts.");
    console.log(`Summary: ${JSON.stringify({ ...summary, sent: 0 })}`);
    return { checked: allGames.length, sent: 0, pending: 0, duplicates: duplicateCount };
  }

  for (const game of newGames) {
    if (dryRun) {
      const label =
        game.alertType === "event"
          ? "Event"
          : game.alertType === "sale"
            ? `Sale ${game.discountPercent}%`
            : "Free";
      console.log(`[Dry run] [${label}] ${game.title} - ${game.url}`);
      continue;
    }

    await sendGame(game);
    markGameAsSent(game.id, sentData);
    console.log(`Sent: ${game.title}`);
  }

  if (dryRun) {
    console.log("Dry run done. No Discord message sent and sent.json was not changed.");
    console.log(`Summary: ${JSON.stringify({ ...summary, sent: 0, pending: newGames.length })}`);
    return { checked: allGames.length, sent: 0, pending: newGames.length, duplicates: duplicateCount };
  }

  saveSent(sentData);

  console.log("Done.");
  console.log(`Summary: ${JSON.stringify({ ...summary, sent: newGames.length })}`);

  return { checked: allGames.length, sent: newGames.length, pending: 0, duplicates: duplicateCount };
}

if (require.main === module) {
  runChecker({
    dryRun: process.argv.includes("--dry-run"),
  }).catch((error) => {
    console.error("Bot failed:", error.message);
    process.exit(1);
  });
}

module.exports = {
  readBooleanEnv,
  readNumberEnv,
  runChecker,
};
