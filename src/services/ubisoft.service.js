const { fetchWithRetry } = require("../utils/request");

const GAMERPOWER_UBISOFT_URL = "https://www.gamerpower.com/api/giveaways";

/**
 * Định dạng ngày giờ hết hạn
 */
function formatUbisoftEndDate(endDateStr) {
  if (!endDateStr || endDateStr === "N/A") {
    return "Xem trên Ubisoft";
  }
  return endDateStr;
}

/**
 * Ánh xạ dữ liệu thô từ GamerPower sang object chuẩn của Bot
 */
function mapUbisoftGame(item) {
  return {
    id: `ubisoft:${item.id}`,
    title: item.title,
    alertType: "free",
    platform: "Ubisoft Connect",
    originalPrice: item.worth || "Unknown",
    currentPrice: "Free",
    priceValue: 0,
    endDate: formatUbisoftEndDate(item.end_date),
    url: item.open_giveaway_url || "https://store.ubisoft.com/",
    image: item.image || item.thumbnail || "",
  };
}

/**
 * Lấy danh sách game đang miễn phí trên Ubisoft Connect qua API GamerPower
 */
async function getUbisoftFreeGames() {
  try {
    const response = await fetchWithRetry(GAMERPOWER_UBISOFT_URL, {
      method: "GET",
      timeout: 20_000,
      params: {
        platform: "ubisoft",
        type: "game", // Chỉ lấy game đầy đủ (Full Games), loại bỏ DLC và in-game loot linh tinh
      },
    });

    const items = Array.isArray(response.data) ? response.data : [];

    // Chỉ lấy các đợt phát tặng đang hoạt động (Active)
    return items
      .filter((item) => item.status === "Active")
      .map(mapUbisoftGame);
  } catch (error) {
    console.error("[Ubisoft] Lỗi khi lấy danh sách game miễn phí:", error.message);
    return [];
  }
}

module.exports = {
  GAMERPOWER_UBISOFT_URL,
  getUbisoftFreeGames,
  mapUbisoftGame,
};
