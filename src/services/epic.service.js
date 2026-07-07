const { fetchWithRetry } = require("../utils/request");

const EPIC_FREE_GAMES_URL =
  "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions";

/**
 * Lấy chương trình khuyến mãi miễn phí hiện tại của game
 */
function getCurrentFreePromotion(game, now = new Date()) {
  const offerGroups = game.promotions?.promotionalOffers || [];

  for (const group of offerGroups) {
    for (const offer of group.promotionalOffers || []) {
      const startDate = new Date(offer.startDate);
      const endDate = new Date(offer.endDate);
      const isFree = offer.discountSetting?.discountPercentage === 0;

      if (isFree && startDate <= now && now < endDate) {
        return offer;
      }
    }
  }

  return null;
}

/**
 * Lấy chương trình khuyến mãi miễn phí SẮP DIỄN RA của game (Upcoming)
 */
function getUpcomingFreePromotion(game, now = new Date()) {
  const offerGroups = game.promotions?.upcomingPromotionalOffers || [];

  for (const group of offerGroups) {
    for (const offer of group.promotionalOffers || []) {
      const startDate = new Date(offer.startDate);
      const isFree = offer.discountSetting?.discountPercentage === 0;

      if (isFree && startDate > now) {
        return offer;
      }
    }
  }

  return null;
}

/**
 * Lấy chương trình giảm giá hiện tại của game
 */
function getCurrentSalePromotion(game, now = new Date(), minDiscountPercent = 80) {
  const offerGroups = game.promotions?.promotionalOffers || [];

  for (const group of offerGroups) {
    for (const offer of group.promotionalOffers || []) {
      const startDate = new Date(offer.startDate);
      const endDate = new Date(offer.endDate);
      const discountPercent = offer.discountSetting?.discountPercentage;
      const isDeepSale = discountPercent >= minDiscountPercent;

      if (isDeepSale && startDate <= now && now < endDate) {
        return offer;
      }
    }
  }

  return null;
}

/**
 * Trích xuất store slug để tạo đường dẫn game
 */
function getStoreSlug(game) {
  return (
    game.productSlug ||
    game.offerMappings?.[0]?.pageSlug ||
    game.catalogNs?.mappings?.[0]?.pageSlug ||
    game.urlSlug
  );
}

/**
 * Tạo URL trang chi tiết game trên trình duyệt web
 */
function getGameUrl(game) {
  const slug = getStoreSlug(game);

  if (!slug) {
    return "https://store.epicgames.com/free-games";
  }

  return `https://store.epicgames.com/p/${slug.replace(/\/home$/, "")}`;
}

/**
 * Tạo URL mở game trực tiếp trên Epic Games Launcher
 */
function getEpicAppUrl(game) {
  const slug = getStoreSlug(game);

  if (!slug) {
    return "";
  }

  return `com.epicgames.launcher://store/p/${slug.replace(/\/home$/, "")}`;
}

/**
 * Lấy ảnh bìa game theo thứ tự ưu tiên các kích thước/định dạng
 */
function getGameImage(game) {
  const preferredTypes = ["OfferImageWide", "featuredMedia", "Thumbnail"];

  for (const type of preferredTypes) {
    const image = game.keyImages?.find((item) => item.type === type && item.url);

    if (image) {
      return image.url;
    }
  }

  return "";
}

/**
 * Định dạng ngày giờ theo múi giờ Việt Nam
 */
function formatDate(isoDate) {
  if (!isoDate) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

/**
 * Map dữ liệu thô từ Epic sang object chuẩn của Bot cho game đang miễn phí
 */
function mapEpicGame(game, promotion) {
  const price = game.price?.totalPrice?.fmtPrice;

  return {
    id: `epic:${game.id}`,
    title: game.title,
    alertType: "free",
    platform: "Epic Games Store",
    originalPrice: price?.originalPrice || "Unknown",
    currentPrice: "Free",
    endDate: formatDate(promotion.endDate),
    url: getGameUrl(game),
    appUrl: getEpicAppUrl(game),
    image: getGameImage(game),
  };
}

/**
 * Map dữ liệu thô từ Epic sang object chuẩn của Bot cho game SẮP miễn phí (Upcoming)
 */
function mapEpicUpcomingGame(game, promotion) {
  const price = game.price?.totalPrice?.fmtPrice;

  return {
    id: `epic-upcoming:${game.id}`,
    title: game.title,
    alertType: "upcoming",
    platform: "Epic Games Store",
    originalPrice: price?.originalPrice || "Unknown",
    currentPrice: "Sắp miễn phí",
    startDate: formatDate(promotion.startDate),
    endDate: formatDate(promotion.endDate),
    url: getGameUrl(game),
    appUrl: getEpicAppUrl(game),
    image: getGameImage(game),
  };
}

/**
 * Map dữ liệu thô từ Epic sang object chuẩn của Bot cho game đang giảm giá sâu
 */
function mapEpicSaleGame(game, promotion) {
  const price = game.price?.totalPrice?.fmtPrice;
  const discountPercent = promotion.discountSetting?.discountPercentage;

  return {
    id: `epic-sale:${game.id}:${discountPercent}:${promotion.endDate}`,
    title: game.title,
    alertType: "sale",
    platform: "Epic Games Store",
    originalPrice: price?.originalPrice || "Unknown",
    currentPrice: price?.discountPrice || price?.intermediatePrice || "Unknown",
    discountPercent,
    endDate: formatDate(promotion.endDate),
    url: getGameUrl(game),
    appUrl: getEpicAppUrl(game),
    image: getGameImage(game),
  };
}

/**
 * Gửi request lấy dữ liệu từ catalog của Epic Games Store
 */
async function fetchEpicGames({ country = "VN", locale = "en-US" } = {}) {
  const response = await fetchWithRetry(EPIC_FREE_GAMES_URL, {
    method: "GET",
    timeout: 20_000,
    params: {
      locale,
      country,
      allowCountries: country,
    },
  });

  return response.data?.data?.Catalog?.searchStore?.elements || [];
}

/**
 * Lấy danh sách game đang miễn phí trên Epic Store
 */
async function getEpicFreeGames(options = {}) {
  const games = await fetchEpicGames(options);

  return games
    .map((game) => {
      const promotion = getCurrentFreePromotion(game);
      return promotion ? mapEpicGame(game, promotion) : null;
    })
    .filter(Boolean);
}

/**
 * Lấy danh sách game sắp miễn phí trên Epic Store
 */
async function getEpicUpcomingGames(options = {}) {
  const games = await fetchEpicGames(options);

  return games
    .map((game) => {
      const promotion = getUpcomingFreePromotion(game);
      return promotion ? mapEpicUpcomingGame(game, promotion) : null;
    })
    .filter(Boolean);
}

/**
 * Lấy danh sách game đang giảm giá mạnh trên Epic Store
 */
async function getEpicSaleGames({
  country = "VN",
  locale = "en-US",
  minDiscountPercent = 80,
  limit = 5,
} = {}) {
  const games = await fetchEpicGames({ country, locale });

  return games
    .map((game) => {
      const promotion = getCurrentSalePromotion(game, new Date(), minDiscountPercent);
      return promotion ? mapEpicSaleGame(game, promotion) : null;
    })
    .filter(Boolean)
    .slice(0, limit);
}

module.exports = {
  EPIC_FREE_GAMES_URL,
  getCurrentFreePromotion,
  getUpcomingFreePromotion,
  getCurrentSalePromotion,
  getEpicFreeGames,
  getEpicUpcomingGames,
  getEpicSaleGames,
  getEpicAppUrl,
  mapEpicGame,
  mapEpicUpcomingGame,
  mapEpicSaleGame,
};
