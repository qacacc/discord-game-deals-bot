const assert = require("node:assert/strict");
const test = require("node:test");

const {
  parseSteamSaleResults,
  parseSteamSearchResults,
} = require("../src/services/steam.service");

test("parse Steam game dang giam ve mien phi", () => {
  const html = `
    <a href="https://store.steampowered.com/app/123456/Test_Game/?snr=1"
       data-ds-appid="123456"
       class="search_result_row ds_collapse_flag">
      <div class="search_capsule">
        <img src="https://example.com/capsule.jpg">
      </div>
      <span class="title">Test &amp; Game</span>
      <div class="search_price_discount_combined" data-price-final="0">
        <div class="discount_original_price">100.000₫</div>
        <div class="discount_final_price">Free</div>
      </div>
    </a>
  `;

  const games = parseSteamSearchResults(html);

  assert.equal(games.length, 1);
  assert.deepEqual(games[0], {
    id: "steam:123456",
    title: "Test & Game",
    alertType: "free",
    platform: "Steam",
    originalPrice: "100.000₫",
    currentPrice: "Free",
    endDate: "Xem trên Steam",
    url: "https://store.steampowered.com/app/123456/Test_Game/",
    appUrl: "steam://store/123456",
    image: "https://example.com/capsule.jpg",
  });
});

test("bo qua Steam game chi sale nhung khong free", () => {
  const html = `
    <a href="https://store.steampowered.com/app/999999/Paid_Game/"
       data-ds-appid="999999"
       class="search_result_row">
      <span class="title">Paid Game</span>
      <div class="search_price_discount_combined" data-price-final="9900000">
        <div class="discount_original_price">165.000₫</div>
        <div class="discount_final_price">99.000₫</div>
      </div>
    </a>
  `;

  assert.deepEqual(parseSteamSearchResults(html), []);
});

test("parse Steam sale giam sau theo nguong", () => {
  const html = `
    <a href="https://store.steampowered.com/app/777777/Sale_Game/?snr=1"
       data-ds-appid="777777"
       class="search_result_row ds_collapse_flag">
      <img src="https://example.com/sale.jpg">
      <span class="title">Sale Game</span>
      <div class="search_price_discount_combined" data-price-final="5000000">
        <div class="discount_pct">-90%</div>
        <div class="discount_original_price">500.000₫</div>
        <div class="discount_final_price">50.000₫</div>
      </div>
    </a>
  `;

  const games = parseSteamSaleResults(html, { minDiscountPercent: 80, limit: 5 });

  assert.equal(games.length, 1);
  assert.equal(games[0].id, "steam-sale:777777:90:5000000");
  assert.equal(games[0].alertType, "sale");
  assert.equal(games[0].discountPercent, 90);
  assert.equal(games[0].appUrl, "steam://store/777777");
});
