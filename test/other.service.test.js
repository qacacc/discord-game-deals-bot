const assert = require("node:assert/strict");
const test = require("node:test");

const { mapOtherGame } = require("../src/services/other.service");

test("map PC product tu GamerPower sang du lieu chuẩn cua Bot", () => {
  const result = mapOtherGame({
    id: 888,
    title: "Itch.io Free Game",
    worth: "$9.99",
    image: "https://example.com/itch.jpg",
    open_giveaway_url: "https://example.com/giveaway",
    status: "Active",
    platforms: "PC, Itch.io",
    end_date: "2026-10-31",
  });

  assert.equal(result.id, "other:888");
  assert.equal(result.title, "Itch.io Free Game");
  assert.equal(result.platform, "Itch.io");
  assert.equal(result.currentPrice, "Free");
  assert.equal(result.url, "https://example.com/giveaway");
  assert.equal(result.image, "https://example.com/itch.jpg");
  assert.equal(result.endDate, "2026-10-31");
});
