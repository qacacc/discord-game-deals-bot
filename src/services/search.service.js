const { fetchWithRetry } = require("../utils/request");

/**
 * Tìm kiếm deal game trên Steam Store
 */
async function searchSteam(keyword) {
  const isUs = (process.env.CURRENCY_LOCALE || "VN").toUpperCase() === "US";
  const cc = isUs ? "us" : "vn";
  const l = isUs ? "english" : "vietnamese";
  const currencySign = isUs ? "$" : "₫";

  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(keyword)}&l=${l}&cc=${cc}`;

  try {
    const res = await fetchWithRetry(url, { method: "GET", timeout: 10_000 });
    const items = res.data && Array.isArray(res.data.items) ? res.data.items : [];

    return items.slice(0, 3).map((item) => {
      let originalPrice = "Free";
      let currentPrice = "Free";
      let discountPercent = 0;
      let priceValue = 0;

      if (item.price) {
        priceValue = item.price.final / 100;
        discountPercent = item.price.discount_percent || 0;
        
        if (isUs) {
          originalPrice = `$${(item.price.initial / 100).toFixed(2)}`;
          currentPrice = `$${priceValue.toFixed(2)}`;
        } else {
          // Định dạng VNĐ dạng 100.000₫
          originalPrice = `${(item.price.initial / 100).toLocaleString("vi-VN")}₫`;
          currentPrice = `${priceValue.toLocaleString("vi-VN")}₫`;
        }
      }

      return {
        store: "Steam",
        title: item.name,
        originalPrice,
        currentPrice,
        discountPercent,
        priceValue,
        url: `https://store.steampowered.com/app/${item.id}/`,
        image: item.tiny_image || "",
      };
    });
  } catch (err) {
    console.error("[Search Steam] Lỗi tìm kiếm game:", err.message);
    return [];
  }
}

/**
 * Tìm kiếm deal game trên Epic Games Store
 */
async function searchEpic(keyword) {
  const isUs = (process.env.CURRENCY_LOCALE || "VN").toUpperCase() === "US";
  const country = isUs ? "US" : "VN";
  const locale = isUs ? "en-US" : "vi-VN";

  const url = "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions";

  try {
    const res = await fetchWithRetry(url, {
      method: "GET",
      timeout: 10_000,
      params: {
        locale,
        country,
        allowCountries: country,
      },
    });

    const elements = res.data?.data?.Catalog?.searchStore?.elements || [];
    const keywordLower = keyword.toLowerCase();

    // Lọc local các game trùng với từ khóa tìm kiếm
    const matchedElements = elements.filter(item => 
      item.title && item.title.toLowerCase().includes(keywordLower)
    );

    return matchedElements.slice(0, 3).map((item) => {
      const tp = item.price?.totalPrice;
      const fmt = tp?.fmtPrice;

      let priceValue = tp ? tp.discountPrice : 0;
      if (!isUs && tp) {
        priceValue = priceValue / 100;
      }

      let originalPrice = fmt?.originalPrice || "0₫";
      let currentPrice = fmt?.discountPrice || "0₫";
      
      if (tp && tp.originalPrice === 0) {
        originalPrice = "Free";
      }
      if (tp && tp.discountPrice === 0) {
        currentPrice = "Free";
      }

      // Tìm ảnh đại diện
      let image = "";
      if (Array.isArray(item.keyImages)) {
        const cover = item.keyImages.find((img) => img.type === "Thumbnail" || img.type === "DieselStoreFrontWide");
        image = cover ? cover.url : item.keyImages[0]?.url || "";
      }

      const discountPercent = tp && tp.originalPrice > 0 
        ? Math.round(((tp.originalPrice - tp.discountPrice) / tp.originalPrice) * 100)
        : 0;

      // Xây dựng link game
      let gameUrl = `https://store.epicgames.com/p/`;
      if (item.catalogNs?.mappings && item.catalogNs.mappings.length > 0) {
        gameUrl += item.catalogNs.mappings[0].pageSlug || item.productSlug || item.id;
      } else if (item.productSlug) {
        gameUrl += item.productSlug;
      } else {
        gameUrl += item.id;
      }

      return {
        store: "Epic Store",
        title: item.title,
        originalPrice,
        currentPrice,
        discountPercent,
        priceValue,
        url: gameUrl,
        image,
      };
    });
  } catch (err) {
    console.error("[Search Epic] Lỗi tìm kiếm game:", err.message);
    return [];
  }
}

/**
 * Tìm kiếm deal game gộp từ cả hai store
 */
async function searchAllDeals(keyword) {
  if (!keyword || !keyword.trim()) {
    return [];
  }
  const [steamDeals, epicDeals] = await Promise.all([
    searchSteam(keyword),
    searchEpic(keyword),
  ]);
  return [...steamDeals, ...epicDeals];
}

module.exports = {
  searchSteam,
  searchEpic,
  searchAllDeals,
};
