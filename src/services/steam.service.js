const axios = require("axios");

const STEAM_SEARCH_URL = "https://store.steampowered.com/search/results/";

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripTracking(url = "") {
  return decodeHtml(url).split("?")[0];
}

function extractFirst(pattern, text) {
  const match = text.match(pattern);
  return match ? decodeHtml(match[1]) : "";
}

function getSteamAppUrl(appId) {
  return `steam://store/${appId}`;
}

function parseSteamSearchResults(html = "") {
  const rows = html.match(/<a[\s\S]*?class="[^"]*search_result_row[^"]*"[\s\S]*?<\/a>/g) || [];

  return rows
    .map((row) => {
      const appId = extractFirst(/data-ds-appid="([^"]+)"/, row);
      const title = extractFirst(/<span class="title">([\s\S]*?)<\/span>/, row);
      const url = stripTracking(extractFirst(/href="([^"]+)"/, row));
      const image = decodeHtml(extractFirst(/<img src="([^"]+)"/, row));
      const originalPrice = extractFirst(
        /<div class="discount_original_price">([\s\S]*?)<\/div>/,
        row,
      );
      const finalPrice = extractFirst(/<div class="discount_final_price">([\s\S]*?)<\/div>/, row);
      const finalValue = Number(extractFirst(/data-price-final="(\d+)"/, row));
      const discountPercent = Number(extractFirst(/<div class="discount_pct">-(\d+)%<\/div>/, row));

      if (!appId || !title || finalValue !== 0) {
        return null;
      }

      return {
        id: `steam:${appId}`,
        title,
        alertType: "free",
        platform: "Steam",
        originalPrice: originalPrice || "Unknown",
        currentPrice: finalPrice || "Free",
        endDate: "Xem trên Steam",
        url,
        appUrl: getSteamAppUrl(appId),
        image,
      };
    })
    .filter(Boolean);
}

function parseSteamSaleResults(html = "", { minDiscountPercent = 80, limit = 5 } = {}) {
  const rows = html.match(/<a[\s\S]*?class="[^"]*search_result_row[^"]*"[\s\S]*?<\/a>/g) || [];

  return rows
    .map((row) => {
      const appId = extractFirst(/data-ds-appid="([^"]+)"/, row);
      const title = extractFirst(/<span class="title">([\s\S]*?)<\/span>/, row);
      const url = stripTracking(extractFirst(/href="([^"]+)"/, row));
      const image = decodeHtml(extractFirst(/<img src="([^"]+)"/, row));
      const originalPrice = extractFirst(
        /<div class="discount_original_price">([\s\S]*?)<\/div>/,
        row,
      );
      const finalPrice = extractFirst(/<div class="discount_final_price">([\s\S]*?)<\/div>/, row);
      const finalValue = Number(extractFirst(/data-price-final="(\d+)"/, row));
      const discountPercent = Number(extractFirst(/<div class="discount_pct">-(\d+)%<\/div>/, row));

      if (!appId || !title || finalValue <= 0 || discountPercent < minDiscountPercent) {
        return null;
      }

      return {
        id: `steam-sale:${appId}:${discountPercent}:${finalValue}`,
        title,
        alertType: "sale",
        platform: "Steam",
        originalPrice: originalPrice || "Unknown",
        currentPrice: finalPrice || "Unknown",
        discountPercent,
        endDate: "Xem trên Steam",
        url,
        appUrl: getSteamAppUrl(appId),
        image,
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

async function getSteamFreeGames({ country = "vn", language = "english" } = {}) {
  const response = await axios.get(STEAM_SEARCH_URL, {
    timeout: 20_000,
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    params: {
      query: "",
      start: 0,
      count: 50,
      dynamic_data: "",
      sort_by: "_ASC",
      specials: 1,
      maxprice: "free",
      category1: 998,
      infinite: 1,
      cc: country,
      l: language,
    },
  });

  return parseSteamSearchResults(response.data?.results_html || "");
}

async function getSteamSaleGames({
  country = "vn",
  language = "english",
  minDiscountPercent = 80,
  limit = 5,
} = {}) {
  const response = await axios.get(STEAM_SEARCH_URL, {
    timeout: 20_000,
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    params: {
      query: "",
      start: 0,
      count: 50,
      dynamic_data: "",
      sort_by: "_ASC",
      specials: 1,
      category1: 998,
      infinite: 1,
      cc: country,
      l: language,
    },
  });

  return parseSteamSaleResults(response.data?.results_html || "", {
    minDiscountPercent,
    limit,
  });
}

module.exports = {
  STEAM_SEARCH_URL,
  getSteamFreeGames,
  getSteamSaleGames,
  getSteamAppUrl,
  parseSteamSaleResults,
  parseSteamSearchResults,
};
