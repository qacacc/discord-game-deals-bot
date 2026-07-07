const assert = require("node:assert/strict");
const test = require("node:test");

const { mapUbisoftGame } = require("../src/services/ubisoft.service");

test("map Ubisoft Connect product tu GamerPower sang du lieu chuẩn cua Bot", () => {
  const result = mapUbisoftGame({
    id: 999,
    title: "Ubisoft Test Game",
    worth: "$19.99",
    image: "https://example.com/ubisoft.jpg",
    open_giveaway_url: "https://example.com/giveaway",
    status: "Active",
    end_date: "2026-12-31",
  });

  assert.equal(result.id, "ubisoft:999");
  assert.equal(result.title, "Ubisoft Test Game");
  assert.equal(result.platform, "Ubisoft Connect");
  assert.equal(result.currentPrice, "Free");
  assert.equal(result.url, "https://example.com/giveaway");
  assert.equal(result.image, "https://example.com/ubisoft.jpg");
  assert.equal(result.endDate, "2026-12-31");
});
