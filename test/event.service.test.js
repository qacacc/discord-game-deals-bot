const assert = require("node:assert/strict");
const test = require("node:test");

const { getActiveSaleEvents } = require("../src/services/event.service");

test("nhan dien Steam Summer Sale dang dien ra", () => {
  const events = getActiveSaleEvents({
    steamSales: [
      {
        title: "Sale Game",
        discountPercent: 90,
      },
    ],
    now: new Date("2026-07-08T00:00:00.000Z"),
  });

  assert.equal(events.length, 1);
  assert.equal(events[0].id, "event:steam-summer-sale-2026");
  assert.equal(events[0].alertType, "event");
  assert.equal(events[0].platform, "Steam");
});

test("tao event Epic Sales & Specials khi Epic co deal sale", () => {
  const events = getActiveSaleEvents({
    epicSales: [
      {
        title: "Epic Sale Game",
        discountPercent: 80,
      },
    ],
    now: new Date("2026-07-08T00:00:00.000Z"),
  });

  assert.equal(events.some((event) => event.id === "event:epic-sales-and-specials"), true);
});

test("tao reminder truoc khi event ket thuc 1 ngay", () => {
  const events = getActiveSaleEvents({
    steamSales: [],
    now: new Date("2026-07-09T00:00:00.000Z"),
  });

  assert.equal(events.some((event) => event.id === "event:steam-summer-sale-2026"), true);
  assert.equal(events.some((event) => event.id === "event-reminder:steam-summer-sale-2026"), true);
});
