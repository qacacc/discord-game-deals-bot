const assert = require("node:assert/strict");
const test = require("node:test");

const {
  getCurrentFreePromotion,
  getUpcomingFreePromotion,
  getCurrentSalePromotion,
  mapEpicGame,
  mapEpicUpcomingGame,
  mapEpicSaleGame,
} = require("../src/services/epic.service");

test("nhan dien promotion dang free hien tai", () => {
  const promotion = {
    startDate: "2026-07-02T15:00:00.000Z",
    endDate: "2026-07-09T15:00:00.000Z",
    discountSetting: {
      discountPercentage: 0,
    },
  };

  const game = {
    promotions: {
      promotionalOffers: [{ promotionalOffers: [promotion] }],
    },
  };

  assert.equal(
    getCurrentFreePromotion(game, new Date("2026-07-08T00:00:00.000Z")),
    promotion,
  );
});

test("bo qua promotion sale hoac chua toi han free", () => {
  const game = {
    promotions: {
      promotionalOffers: [
        {
          promotionalOffers: [
            {
              startDate: "2026-07-02T15:00:00.000Z",
              endDate: "2026-07-09T15:00:00.000Z",
              discountSetting: {
                discountPercentage: 50,
              },
            },
            {
              startDate: "2026-07-09T15:00:00.000Z",
              endDate: "2026-07-16T15:00:00.000Z",
              discountSetting: {
                discountPercentage: 0,
              },
            },
          ],
        },
      ],
    },
  };

  assert.equal(
    getCurrentFreePromotion(game, new Date("2026-07-08T00:00:00.000Z")),
    null,
  );
});

test("nhan dien promotion sap free trong tuong lai", () => {
  const upcomingPromotion = {
    startDate: "2026-07-09T15:00:00.000Z",
    endDate: "2026-07-16T15:00:00.000Z",
    discountSetting: {
      discountPercentage: 0,
    },
  };

  const game = {
    promotions: {
      upcomingPromotionalOffers: [{ promotionalOffers: [upcomingPromotion] }],
    },
  };

  assert.equal(
    getUpcomingFreePromotion(game, new Date("2026-07-08T00:00:00.000Z")),
    upcomingPromotion,
  );
});

test("map Epic game thanh du lieu Discord can gui", () => {
  const result = mapEpicGame(
    {
      id: "game-id",
      title: "River City Girls 2",
      offerMappings: [{ pageSlug: "river-city-girls-2-77af3a" }],
      keyImages: [{ type: "OfferImageWide", url: "https://example.com/a.png" }],
      price: {
        totalPrice: {
          fmtPrice: {
            originalPrice: "VND 418,000",
          },
        },
      },
    },
    {
      endDate: "2026-07-09T15:00:00.000Z",
    },
  );

  assert.equal(result.id, "epic:game-id");
  assert.equal(result.currentPrice, "Free");
  assert.equal(result.url, "https://store.epicgames.com/p/river-city-girls-2-77af3a");
  assert.equal(result.appUrl, "com.epicgames.launcher://store/p/river-city-girls-2-77af3a");
  assert.equal(result.image, "https://example.com/a.png");
});

test("map Epic upcoming game thanh du lieu Discord can gui", () => {
  const result = mapEpicUpcomingGame(
    {
      id: "upcoming-game-id",
      title: "Upcoming Game",
      offerMappings: [{ pageSlug: "upcoming-game" }],
      keyImages: [{ type: "OfferImageWide", url: "https://example.com/upcoming.png" }],
      price: {
        totalPrice: {
          fmtPrice: {
            originalPrice: "VND 300,000",
          },
        },
      },
    },
    {
      startDate: "2026-07-09T15:00:00.000Z",
      endDate: "2026-07-16T15:00:00.000Z",
    },
  );

  assert.equal(result.id, "epic-upcoming:upcoming-game-id");
  assert.equal(result.currentPrice, "Sắp miễn phí");
  assert.equal(result.url, "https://store.epicgames.com/p/upcoming-game");
  assert.equal(result.image, "https://example.com/upcoming.png");
});

test("nhan dien sale Epic dang dien ra theo nguong giam gia", () => {
  const promotion = {
    startDate: "2026-07-02T15:00:00.000Z",
    endDate: "2026-07-09T15:00:00.000Z",
    discountSetting: {
      discountPercentage: 90,
    },
  };

  const game = {
    promotions: {
      promotionalOffers: [{ promotionalOffers: [promotion] }],
    },
  };

  assert.equal(
    getCurrentSalePromotion(game, new Date("2026-07-08T00:00:00.000Z"), 80),
    promotion,
  );
});

test("map Epic sale thanh du lieu thong bao sale", () => {
  const result = mapEpicSaleGame(
    {
      id: "sale-game-id",
      title: "Epic Sale Game",
      productSlug: "epic-sale-game",
      keyImages: [],
      price: {
        totalPrice: {
          fmtPrice: {
            originalPrice: "500.000₫",
            discountPrice: "50.000₫",
          },
        },
      },
    },
    {
      endDate: "2026-07-09T15:00:00.000Z",
      discountSetting: {
        discountPercentage: 90,
      },
    },
  );

  assert.equal(result.id, "epic-sale:sale-game-id:90:2026-07-09T15:00:00.000Z");
  assert.equal(result.alertType, "sale");
  assert.equal(result.discountPercent, 90);
  assert.equal(result.currentPrice, "50.000₫");
});
