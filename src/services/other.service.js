const { fetchWithRetry } = require("../utils/request");

const GAMERPOWER_PC_URL = "https://www.gamerpower.com/api/giveaways";

/**
 * Xác định tên hiển thị nền tảng đẹp mắt
 */
function getDisplayPlatform(platformsStr = "") {
  const lower = platformsStr.toLowerCase();
  if (lower.includes("itch.io")) {
    return "Itch.io";
  }
  if (lower.includes("indiegala")) {
    return "IndieGala";
  }
  if (lower.includes("xbox")) {
    return "Xbox";
  }
  if (lower.includes("playstation")) {
    return "PlayStation";
  }
  return "PC Game";
}

/**
 * Ánh xạ dữ liệu từ GamerPower sang object chuẩn của Bot
 */
function mapOtherGame(item) {
  return {
    id: `other:${item.id}`,
    title: item.title,
    alertType: "free",
    platform: getDisplayPlatform(item.platforms),
    originalPrice: item.worth || "Unknown",
    currentPrice: "Free",
    priceValue: 0,
    endDate: item.end_date && item.end_date !== "N/A" ? item.end_date : "Xem trên nguồn phát",
    url: item.open_giveaway_url || "https://www.gamerpower.com/",
    image: item.image || item.thumbnail || "",
  };
}

/**
 * Lấy danh sách game đang miễn phí trên các nền tảng PC khác (Itch.io, IndieGala, Xbox...)
 */
async function getOtherFreeGames() {
  try {
    const response = await fetchWithRetry(GAMERPOWER_PC_URL, {
      method: "GET",
      timeout: 20_000,
      params: {
        platform: "pc",
      },
    });

    const items = Array.isArray(response.data) ? response.data : [];

    // Chỉ lấy các đợt phát tặng đang hoạt động (Active) và
    // KHÔNG thuộc các nền tảng lớn đã quét (Steam, Epic, GOG, Ubisoft)
    return items
      .filter((item) => {
        const isNotActive = item.status !== "Active";
        if (isNotActive) {
          return false;
        }

        const platforms = (item.platforms || "").toLowerCase();
        const isMajorPlatform =
          platforms.includes("steam") ||
          platforms.includes("epic") ||
          platforms.includes("gog") ||
          platforms.includes("ubisoft");

        return !isMajorPlatform;
      })
      .map(mapOtherGame);
  } catch (error) {
    console.error("[Other Platforms] Lỗi khi lấy danh sách game miễn phí:", error.message);
    return [];
  }
}

module.exports = {
  GAMERPOWER_PC_URL,
  getOtherFreeGames,
  mapOtherGame,
};
