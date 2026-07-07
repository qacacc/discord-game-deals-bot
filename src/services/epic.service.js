const axios = require("axios");

const EPIC_FREE_GAMES_URL =
  "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions";

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

function getStoreSlug(game) {
  return (
    game.productSlug ||
    game.offerMappings?.[0]?.pageSlug ||
    game.catalogNs?.mappings?.[0]?.pageSlug ||
    game.urlSlug
  );
}

function getGameUrl(game) {
  const slug = getStoreSlug(game);

  if (!slug) {
    return "https://store.epicgames.com/free-games";
  }

  return `https://store.epicgames.com/p/${slug.replace(/\/home$/, "")}`;
}

function getEpicAppUrl(game) {
  const slug = getStoreSlug(game);

  if (!slug) {
    return "";
  }

  return `com.epicgames.launcher://store/p/${slug.replace(/\/home$/, "")}`;
}

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

async function fetchEpicGames({ country = "VN", locale = "en-US" } = {}) {
  const response = await axios.get(EPIC_FREE_GAMES_URL, {
    timeout: 20_000,
    params: {
      locale,
      country,
      allowCountries: country,
    },
  });

  return response.data?.data?.Catalog?.searchStore?.elements || [];
}

async function getEpicFreeGames(options = {}) {
  const games = await fetchEpicGames(options);

  return games
    .map((game) => {
      const promotion = getCurrentFreePromotion(game);
      return promotion ? mapEpicGame(game, promotion) : null;
    })
    .filter(Boolean);
}

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
  getCurrentSalePromotion,
  getEpicFreeGames,
  getEpicSaleGames,
  getEpicAppUrl,
  mapEpicGame,
  mapEpicSaleGame,
};
