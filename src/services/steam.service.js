const { fetchWithRetry } = require("../utils/request");

const STEAM_SEARCH_URL = "https://store.steampowered.com/search/results/";

/**
 * Giải mã các ký tự HTML cơ bản
 */
function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

/**
 * Loại bỏ các tham số tracking của Steam khỏi URL
 */
function stripTracking(url = "") {
  return decodeHtml(url).split("?")[0];
}

/**
 * Trích xuất giá trị đầu tiên khớp với regex
 */
function extractFirst(pattern, text) {
  const match = text.match(pattern);
  return match ? decodeHtml(match[1]) : "";
}

/**
 * Tạo URL mở game trực tiếp trên ứng dụng Steam client
 */
function getSteamAppUrl(appId) {
  return `steam://store/${appId}`;
}

/**
 * Phân tích cú pháp chuỗi tooltip review của Steam sang định dạng ngắn gọn
 * Ví dụ: "Very Positive<br>85% of the 1,234 user reviews..." -> "Very Positive (85%)"
 */
function parseReviewsTooltip(tooltip = "") {
  const decoded = decodeHtml(tooltip)
    .replace(/<br>/gi, "\n")
    .replace(/<br\s*\/>/gi, "\n");

  const lines = decoded.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return "";
  }

  const rating = lines[0];
  if (lines.length > 1) {
    const percentMatch = lines[1].match(/(\d+)%/);
    if (percentMatch) {
      return `${rating} (${percentMatch[1]}%)`;
    }
  }

  return rating;
}

/**
 * Phân tích cú pháp HTML từ kết quả tìm kiếm của Steam để lọc game miễn phí
 */
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

      const reviewsTooltip = extractFirst(
        /class="[^"]*search_review_summary[^"]*"[^>]*data-tooltip-html="([^"]+)"/,
        row,
      );
      const reviews = reviewsTooltip ? parseReviewsTooltip(reviewsTooltip) : "";

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
        priceValue: 0,
        endDate: "Xem trên Steam",
        url,
        appUrl: getSteamAppUrl(appId),
        image,
        reviews: reviews || undefined,
      };
    })
    .filter(Boolean);
}

/**
 * Phân tích cú pháp HTML từ kết quả tìm kiếm của Steam để lọc game đang giảm giá sâu
 */
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

      const reviewsTooltip = extractFirst(
        /class="[^"]*search_review_summary[^"]*"[^>]*data-tooltip-html="([^"]+)"/,
        row,
      );
      const reviews = reviewsTooltip ? parseReviewsTooltip(reviewsTooltip) : "";

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
        priceValue: finalValue / 100, // Quy đổi giá trị số thực tế (chia cho 100)
        discountPercent,
        endDate: "Xem trên Steam",
        url,
        appUrl: getSteamAppUrl(appId),
        image,
        reviews: reviews || undefined,
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * Lấy danh sách game miễn phí trên Steam (quét nhiều trang kết quả)
 */
async function getSteamFreeGames({ country = "vn", language = "english", pages = 3 } = {}) {
  let allGames = [];

  for (let page = 0; page < pages; page += 1) {
    const start = page * 50;
    try {
      const response = await fetchWithRetry(STEAM_SEARCH_URL, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        params: {
          query: "",
          start,
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

      const html = response.data?.results_html || "";
      if (!html.trim()) {
        break;
      }

      const games = parseSteamSearchResults(html);
      if (games.length === 0) {
        break;
      }

      allGames = allGames.concat(games);
    } catch (error) {
      console.error(`[Steam] Lỗi khi quét trang game miễn phí thứ ${page + 1}:`, error.message);
      if (page === 0) {
        throw error; // Ném lỗi nếu trang đầu tiên thất bại
      }
      break;
    }
  }

  // Loại bỏ các phần tử trùng lặp theo ID
  const seenIds = new Set();
  return allGames.filter((game) => {
    if (seenIds.has(game.id)) {
      return false;
    }
    seenIds.add(game.id);
    return true;
  });
}

/**
 * Lấy danh sách game giảm giá mạnh trên Steam (quét nhiều trang kết quả)
 */
async function getSteamSaleGames({
  country = "vn",
  language = "english",
  minDiscountPercent = 80,
  limit = 5,
  pages = 3,
} = {}) {
  let allGames = [];

  for (let page = 0; page < pages; page += 1) {
    const start = page * 50;
    try {
      const response = await fetchWithRetry(STEAM_SEARCH_URL, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        params: {
          query: "",
          start,
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

      const html = response.data?.results_html || "";
      if (!html.trim()) {
        break;
      }

      // Đặt limit cao khi parse từng trang để không bị mất deal, sau đó sẽ slice ở kết quả cuối cùng
      const games = parseSteamSaleResults(html, { minDiscountPercent, limit: 100 });
      if (games.length === 0) {
        break;
      }

      allGames = allGames.concat(games);
    } catch (error) {
      console.error(`[Steam] Lỗi khi quét trang game sale thứ ${page + 1}:`, error.message);
      if (page === 0) {
        throw error;
      }
      break;
    }
  }

  // Loại bỏ các phần tử trùng lặp theo ID
  const seenIds = new Set();
  const uniqueGames = allGames.filter((game) => {
    if (seenIds.has(game.id)) {
      return false;
    }
    seenIds.add(game.id);
    return true;
  });

  return uniqueGames.slice(0, limit);
}

module.exports = {
  STEAM_SEARCH_URL,
  getSteamFreeGames,
  getSteamSaleGames,
  getSteamAppUrl,
  parseSteamSaleResults,
  parseSteamSearchResults,
  parseReviewsTooltip,
};
