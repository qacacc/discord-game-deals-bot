const assert = require("node:assert/strict");
const test = require("node:test");

const { mapGogGame } = require("../src/services/gog.service");

test("map Gog product sang du lieu Discord can gui", () => {
  const result = mapGogGame({
    id: 12345,
    title: "GOG Test Game",
    slug: "gog-test-game",
    coverHorizontal: "//images.gog-statics.com/cover.jpg",
    price: {
      isFree: true,
    },
    productType: "game",
  });

  assert.equal(result.id, "gog:12345");
  assert.equal(result.title, "GOG Test Game");
  assert.equal(result.platform, "GOG.com");
  assert.equal(result.currentPrice, "Free");
  assert.equal(result.url, "https://www.gog.com/game/gog-test-game");
  assert.equal(result.image, "https://images.gog-statics.com/cover.jpg");
});
