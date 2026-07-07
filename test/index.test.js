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
    getEpicUpcoming: async () => [],
    getSteamGames: async () => [],
    getGogGames: async () => [],
    getEpicSales: async () => [],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async (game) => sentGames.push(game.id),
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(sentGames, ["epic-new-game"]);
  assert.equal(sentData.sent.length, 1);
  assert.equal(sentData.sent[0].id, "epic-new-game");
  assert.equal(sentData.sent[0].title, "Epic New Game");
  assert.deepEqual(result, { checked: 1, sent: 1, pending: 0, duplicates: 0 });
});

test("khong gui lai game da nam trong sent.json (tuong thich nguoc lich su cu)", async () => {
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
    getEpicUpcoming: async () => [],
    getSteamGames: async () => [],
    getGogGames: async () => [],
    getEpicSales: async () => [],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async (game) => sentGames.push(game.id),
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(sentGames, []);
  assert.deepEqual(result, { checked: 1, sent: 0, pending: 0, duplicates: 1 });
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
    getEpicUpcoming: async () => [],
    getSteamGames: async () => [],
    getGogGames: async () => [],
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
  assert.deepEqual(result, { checked: 1, sent: 0, pending: 1, duplicates: 0 });
});

test("gui sale alert khi co deal moi", async () => {
  const sentData = { sent: [] };
  let batchedGames = [];

  const result = await runChecker({
    getEpicGames: async () => [],
    getEpicUpcoming: async () => [],
    getSteamGames: async () => [],
    getGogGames: async () => [],
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
    sendGame: async () => {},
    sendSalesBatch: async (games) => {
      batchedGames = games.map(g => g.id);
    },
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(batchedGames, ["epic-sale:test:90:end"]);
  assert.equal(sentData.sent.length, 1);
  assert.equal(sentData.sent[0].id, "epic-sale:test:90:end");
  assert.deepEqual(result, { checked: 1, sent: 1, pending: 0, duplicates: 0 });
});

test("gui thong bao event truoc game sale", async () => {
  const sentData = { sent: [] };
  const sentGames = [];
  let batchedGames = [];

  const result = await runChecker({
    getEpicGames: async () => [],
    getEpicUpcoming: async () => [],
    getSteamGames: async () => [],
    getGogGames: async () => [],
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
    sendSalesBatch: async (games) => {
      batchedGames = games.map(g => g.id);
    },
    loadSent: () => sentData,
    saveSent: () => {},
  });

  // Event gửi đơn lẻ
  assert.deepEqual(sentGames, ["event:steam-summer-sale-2026"]);
  // Sale gửi theo nhóm
  assert.deepEqual(batchedGames, ["steam-sale:test:90:1000"]);
  assert.deepEqual(result, { checked: 2, sent: 2, pending: 0, duplicates: 0 });
});

test("co the tat Epic bang cau hinh", async () => {
  const result = await runChecker({
    epicEnabled: false,
    steamEnabled: false,
    gogEnabled: false,
    getEpicGames: async () => {
      throw new Error("Epic should be disabled");
    },
    getEpicUpcoming: async () => {
      throw new Error("Epic upcoming should be disabled");
    },
    getSteamGames: async () => {
      throw new Error("Steam should be disabled");
    },
    getGogGames: async () => {
      throw new Error("Gog should be disabled");
    },
    getEpicSales: async () => [],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async () => {},
    loadSent: () => ({ sent: [] }),
    saveSent: () => {},
  });

  assert.deepEqual(result, { checked: 0, sent: 0, pending: 0, duplicates: 0 });
});

test("gui game sap mien phi khi co upcoming game moi", async () => {
  const sentData = { sent: [] };
  const sentGames = [];

  const result = await runChecker({
    getEpicGames: async () => [],
    getEpicUpcoming: async () => [
      {
        id: "epic-upcoming:nova-lands",
        title: "Nova Lands",
        alertType: "upcoming",
        platform: "Epic Games Store",
        url: "https://example.com/upcoming",
      },
    ],
    getSteamGames: async () => [],
    getGogGames: async () => [],
    getEpicSales: async () => [],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async (game) => sentGames.push(game.id),
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(sentGames, ["epic-upcoming:nova-lands"]);
  assert.deepEqual(result, { checked: 1, sent: 1, pending: 0, duplicates: 0 });
});

test("gui deal sale theo nhom (batching) chu khong gui don le", async () => {
  const sentData = { sent: [] };
  const sentGames = [];
  let batchedGames = [];

  const result = await runChecker({
    getEpicGames: async () => [],
    getEpicUpcoming: async () => [],
    getSteamGames: async () => [],
    getGogGames: async () => [],
    getEpicSales: async () => [
      {
        id: "epic-sale:game-1:90:end",
        title: "Epic Sale Game 1",
        alertType: "sale",
        platform: "Epic Games Store",
        discountPercent: 90,
      },
      {
        id: "epic-sale:game-2:80:end",
        title: "Epic Sale Game 2",
        alertType: "sale",
        platform: "Epic Games Store",
        discountPercent: 80,
      }
    ],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async (game) => sentGames.push(game.id),
    sendSalesBatch: async (games) => {
      batchedGames = games.map(g => g.id);
    },
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(sentGames, []);
  assert.deepEqual(batchedGames, ["epic-sale:game-1:90:end", "epic-sale:game-2:80:end"]);
  assert.deepEqual(result, { checked: 2, sent: 2, pending: 0, duplicates: 0 });
});

test("gui game free tu GOG", async () => {
  const sentData = { sent: [] };
  const sentGames = [];

  const result = await runChecker({
    getEpicGames: async () => [],
    getEpicUpcoming: async () => [],
    getSteamGames: async () => [],
    getGogGames: async () => [
      {
        id: "gog:12345",
        title: "GOG Free Game",
        alertType: "free",
        platform: "GOG.com",
        url: "https://www.gog.com/game/gog-free",
      }
    ],
    getEpicSales: async () => [],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async (game) => sentGames.push(game.id),
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(sentGames, ["gog:12345"]);
  assert.deepEqual(result, { checked: 1, sent: 1, pending: 0, duplicates: 0 });
});

test("loc deal sale theo MAX_SALE_PRICE", async () => {
  const sentData = { sent: [] };
  let batchedGames = [];

  const result = await runChecker({
    maxSalePrice: 100000, // Chỉ nhận deal <= 100k
    getEpicGames: async () => [],
    getEpicUpcoming: async () => [],
    getSteamGames: async () => [],
    getGogGames: async () => [],
    getEpicSales: async () => [
      {
        id: "epic-sale:cheap:90:end",
        title: "Cheap Game",
        alertType: "sale",
        platform: "Epic Games Store",
        priceValue: 50000, // 50k -> Nhận
      },
      {
        id: "epic-sale:expensive:50:end",
        title: "Expensive Game",
        alertType: "sale",
        platform: "Epic Games Store",
        priceValue: 150000, // 150k -> Loại bỏ
      }
    ],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async () => {},
    sendSalesBatch: async (games) => {
      batchedGames = games.map(g => g.id);
    },
    loadSent: () => sentData,
    saveSent: () => {},
  });

  assert.deepEqual(batchedGames, ["epic-sale:cheap:90:end"]);
  assert.deepEqual(result, { checked: 1, sent: 1, pending: 0, duplicates: 0 });
});

test("loc deal sale theo PREFERRED_GENRES va EXCLUDED_GENRES", async () => {
  const sentData = { sent: [] };
  let batchedGames = [];

  // Giả lập env preferred & excluded
  process.env.PREFERRED_GENRES = "Action, RPG";
  process.env.EXCLUDED_GENRES = "Casual, Sports";

  const result = await runChecker({
    getEpicGames: async () => [],
    getEpicUpcoming: async () => [],
    getSteamGames: async () => [],
    getGogGames: async () => [],
    getEpicSales: async () => [
      {
        id: "epic-sale:game-action:90:end",
        title: "Action Game",
        alertType: "sale",
        platform: "Epic Games Store",
        genres: "Action, Adventure", // Có Action -> Nhận
      },
      {
        id: "epic-sale:game-sports:80:end",
        title: "Action Sports Game",
        alertType: "sale",
        platform: "Epic Games Store",
        genres: "Action, Sports", // Có Sports (loại trừ) -> Bỏ qua
      },
      {
        id: "epic-sale:game-strategy:80:end",
        title: "Strategy Game",
        alertType: "sale",
        platform: "Epic Games Store",
        genres: "Strategy, Simulation", // Không có Action hay RPG -> Bỏ qua
      }
    ],
    getSteamSales: async () => [],
    getSaleEvents: () => [],
    sendGame: async () => {},
    sendSalesBatch: async (games) => {
      batchedGames = games.map(g => g.id);
    },
    loadSent: () => sentData,
    saveSent: () => {},
  });

  // Cleanup env sau test
  delete process.env.PREFERRED_GENRES;
  delete process.env.EXCLUDED_GENRES;

  assert.deepEqual(batchedGames, ["epic-sale:game-action:90:end"]);
  assert.deepEqual(result, { checked: 1, sent: 1, pending: 0, duplicates: 0 });
});
