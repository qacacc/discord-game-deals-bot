const assert = require("node:assert/strict");
const test = require("node:test");

const { runChecker } = require("../src/index");

test("gui game moi va danh dau da gui", async () => {
  const sentData = { sent: [] };
  const sentGames = [];

  const result = await runChecker({
    getEpicGames: async () => [
      {
        id: "epic-new-game",
        title: "Epic New Game",
        platform: "Epic Games Store",
        url: "https://example.com/game",
      },
    ],
    getSteamGames: async () => [],
    getEpicSales: async () => [],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async (game) => sentGames.push(game.id),
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(sentGames, ["epic-new-game"]);
  assert.deepEqual(sentData.sent, ["epic-new-game"]);
  assert.deepEqual(result, { checked: 1, sent: 1, pending: 0 });
});

test("khong gui lai game da nam trong sent.json", async () => {
  const sentData = { sent: ["epic-old-game"] };
  const sentGames = [];

  const result = await runChecker({
    getEpicGames: async () => [
      {
        id: "epic-old-game",
        title: "Epic Old Game",
        platform: "Epic Games Store",
      },
    ],
    getSteamGames: async () => [],
    getEpicSales: async () => [],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async (game) => sentGames.push(game.id),
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(sentGames, []);
  assert.deepEqual(result, { checked: 1, sent: 0, pending: 0 });
});

test("dry-run khong gui Discord va khong ghi sent.json", async () => {
  const sentData = { sent: [] };
  const sentGames = [];
  let saved = false;

  const result = await runChecker({
    dryRun: true,
    getEpicGames: async () => [
      {
        id: "epic-preview-game",
        title: "Epic Preview Game",
        platform: "Epic Games Store",
        url: "https://example.com/preview",
      },
    ],
    getSteamGames: async () => [],
    getEpicSales: async () => [],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async (game) => sentGames.push(game.id),
    loadSent: () => sentData,
    saveSent: () => {
      saved = true;
    },
  });

  assert.deepEqual(sentGames, []);
  assert.deepEqual(sentData.sent, []);
  assert.equal(saved, false);
  assert.deepEqual(result, { checked: 1, sent: 0, pending: 1 });
});

test("gui sale alert khi co deal moi", async () => {
  const sentData = { sent: [] };
  const sentGames = [];

  const result = await runChecker({
    getEpicGames: async () => [],
    getSteamGames: async () => [],
    getEpicSales: async () => [
      {
        id: "epic-sale:test:90:end",
        title: "Epic Sale Game",
        alertType: "sale",
        platform: "Epic Games Store",
        originalPrice: "500.000₫",
        currentPrice: "50.000₫",
        discountPercent: 90,
        url: "https://example.com/sale",
      },
    ],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async (game) => sentGames.push(game.id),
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(sentGames, ["epic-sale:test:90:end"]);
  assert.deepEqual(sentData.sent, ["epic-sale:test:90:end"]);
  assert.deepEqual(result, { checked: 1, sent: 1, pending: 0 });
});

test("gui thong bao event truoc game sale", async () => {
  const sentData = { sent: [] };
  const sentGames = [];

  const result = await runChecker({
    getEpicGames: async () => [],
    getSteamGames: async () => [],
    getEpicSales: async () => [],
    getSteamSales: async () => [
      {
        id: "steam-sale:test:90:1000",
        title: "Steam Sale Game",
        alertType: "sale",
        platform: "Steam",
        originalPrice: "100.000₫",
        currentPrice: "10.000₫",
        discountPercent: 90,
        url: "https://example.com/steam-sale",
      },
    ],
    getSaleEvents: () => [
      {
        id: "event:steam-summer-sale-2026",
        title: "Steam Summer Sale 2026",
        alertType: "event",
        platform: "Steam",
        eventName: "Steam Summer Sale 2026",
        endDate: "25/6/26 - 10/7/26",
        url: "https://store.steampowered.com/",
      },
    ],
    sendGame: async (game) => sentGames.push(game.id),
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(sentGames, ["event:steam-summer-sale-2026", "steam-sale:test:90:1000"]);
  assert.deepEqual(result, { checked: 2, sent: 2, pending: 0 });
});
