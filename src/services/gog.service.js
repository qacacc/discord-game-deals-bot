const { fetchWithRetry } = require("../utils/request");

const GOG_CATALOG_URL = "https://catalog.gog.com/v1/catalog";

/**
 * Xử lý định dạng URL ảnh của GOG (thêm https: nếu cần thiết)
 */
function getGogImageUrl(url) {
  if (!url) {
    return "";
  }
  if (url.startsWith("//")) {
    return `https:${url}`;
  }
  return url;
}

/**
 * Ánh xạ dữ liệu thô từ GOG API sang object chuẩn của Bot
 */
function mapGogGame(product) {
  return {
    id: `gog:${product.id}`,
    title: product.title,
    alertType: "free",
    platform: "GOG.com",
    originalPrice: "Unknown",
    currentPrice: "Free",
    endDate: "Xem trên GOG",
    url: `https://www.gog.com/game/${product.slug}`,
    image: getGogImageUrl(product.coverHorizontal || product.coverVertical),
  };
}

/**
 * Lấy danh sách game đang miễn phí trên GOG.com
 */
async function getGogFreeGames() {
  try {
    const response = await fetchWithRetry(GOG_CATALOG_URL, {
      method: "GET",
      timeout: 20_000,
      params: {
        limit: 20,
        "price=between": "0:0", // Lọc game có giá bằng 0
      },
    });

    const products = response.data?.products || [];
    
    // Lọc ra các sản phẩm là game và thực sự miễn phí
    return products
      .filter((p) => p.productType === "game" && p.price?.isFree === true)
      .map(mapGogGame);
  } catch (error) {
    console.error("[GOG] Lỗi khi lấy danh sách game miễn phí:", error.message);
    return [];
  }
}

module.exports = {
  GOG_CATALOG_URL,
  getGogFreeGames,
  mapGogGame,
};
