const fs = require("fs");
const path = require("path");
const { fetchWithRetry } = require("../utils/request");

const ICON_FILES = {
  epic: "epic.png",
  event: "event.png",
  free: "free.png",
  sale: "sale.png",
  steam: "steam.png",
  gog: "gog.png",
  ubisoft: "ubisoft.png",
};

const LOCALES = {
  vi: {
    header_event: "Sự Kiện Sale Đang Diễn Ra",
    header_sale: "Game Đang Sale Mạnh",
    header_upcoming: "Game Sắp Miễn Phí",
    header_free: "Game Miễn Phí",
    desc_event: (platform) => `Sự kiện sale đang diễn ra trên **${platform}**.`,
    desc_sale: "Game đang giảm giá mạnh.",
    desc_upcoming: "Game sắp được nhận miễn phí trên Epic Games Store.",
    desc_free: "Game đang miễn phí để nhận.",
    field_platform: "🎮 Nền tảng",
    field_original_price: "💵 Giá gốc",
    field_current_price: "🏷️ Giá hiện tại",
    field_discount: "📉 Giảm giá",
    field_start_date: "📅 Bắt đầu tặng từ",
    field_end_date_free: "📅 Hạn nhận",
    field_end_date_sale: "📅 Hạn giảm giá",
    field_end_date_event: "📅 Thời gian diễn ra",
    field_link_store: "🔗 Link cửa hàng",
    field_link_claim: "🔗 Link nhận",
    field_reviews: "⭐ Đánh giá",
    field_genres: "🏷️ Thể loại",
    field_notes: "📝 Ghi chú",
    field_event_page: "🔗 Trang sự kiện",
    text_open_sale: "Mở trang sale",
    text_view_store: "Xem trên cửa hàng",
    text_claim_game: "Nhận game",
    default_summary: "Bot sẽ gửi các deal nổi bật sau thông báo này.",
    current_free: "Free",
  },
  en: {
    header_event: "Ongoing Sale Event",
    header_sale: "Hot Game Sale",
    header_upcoming: "Upcoming Free Game",
    header_free: "Free Game Alert",
    desc_event: (platform) => `Sale event is live on **${platform}**.`,
    desc_sale: "This game is deeply discounted.",
    desc_upcoming: "This game will be free soon on Epic Games Store.",
    desc_free: "This game is currently free to claim.",
    field_platform: "🎮 Platform",
    field_original_price: "💵 Original Price",
    field_current_price: "🏷️ Current Price",
    field_discount: "📉 Discount",
    field_start_date: "📅 Starts At",
    field_end_date_free: "📅 Claim Deadline",
    field_end_date_sale: "📅 Sale Deadline",
    field_end_date_event: "📅 Event Duration",
    field_link_store: "🔗 Store Link",
    field_link_claim: "🔗 Claim Link",
    field_reviews: "⭐ Reviews",
    field_genres: "🏷️ Genres",
    field_notes: "📝 Notes",
    field_event_page: "🔗 Event Page",
    text_open_sale: "Open sale page",
    text_view_store: "View on store",
    text_claim_game: "Claim game",
    default_summary: "Featured deals will be sent after this announcement.",
    current_free: "Free",
  },
};

/**
 * Lấy ngôn ngữ cấu hình hiển thị
 */
function getLocale() {
  const locale = (process.env.MESSAGE_LOCALE || "vi").toLowerCase();
  return LOCALES[locale] || LOCALES.vi;
}

/**
 * Lấy Webhook URL tương ứng với nền tảng của game
 */
function getWebhookUrl(game = {}) {
  const platform = (game.platform || "").toLowerCase();
  const platformWebhookUrl = platform.includes("epic")
    ? process.env.EPIC_DISCORD_WEBHOOK_URL
    : platform.includes("steam")
      ? process.env.STEAM_DISCORD_WEBHOOK_URL
      : platform.includes("gog")
        ? process.env.GOG_DISCORD_WEBHOOK_URL
        : platform.includes("ubisoft")
          ? process.env.UBISOFT_DISCORD_WEBHOOK_URL
          : "";
  const webhookUrl = platformWebhookUrl || process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "Missing webhook URL. Set EPIC_DISCORD_WEBHOOK_URL, STEAM_DISCORD_WEBHOOK_URL, GOG_DISCORD_WEBHOOK_URL, UBISOFT_DISCORD_WEBHOOK_URL, or DISCORD_WEBHOOK_URL.",
    );
  }

  return webhookUrl;
}

/**
 * Gửi dữ liệu tới Discord Webhook thông qua helper fetchWithRetry
 */
async function postWebhook(url, payload, options = {}) {
  return await fetchWithRetry(url, {
    method: "POST",
    data: payload,
    timeout: 15_000,
    ...options,
  });
}

/**
 * Gửi tin nhắn text đơn giản tới Discord
 */
async function sendDiscordMessage(content) {
  await postWebhook(getWebhookUrl(), { content });
}

/**
 * Lấy tiêu đề hiển thị trong Embed
 */
function getEmbedTitle(game) {
  return game.eventName || game.title;
}

/**
 * Lấy mô tả tóm tắt cho từng loại Alert
 */
function getEmbedDescription(game) {
  const t = getLocale();

  if (game.alertType === "event") {
    return t.desc_event(game.platform);
  }

  if (game.alertType === "sale") {
    return t.desc_sale;
  }

  if (game.alertType === "upcoming") {
    return t.desc_upcoming;
  }

  return t.desc_free;
}

/**
 * Lấy mã màu sắc tương ứng cho Embed
 */
function getEmbedColor(game) {
  if (game.alertType === "event") {
    return 0x3498db; // Xanh dương
  }

  if (game.alertType === "sale") {
    return 0xf1c40f; // Vàng
  }

  if (game.alertType === "upcoming") {
    return 0x9b59b6; // Tím cho game sắp ra mắt
  }

  return 0x2ecc71; // Xanh lá
}

/**
 * Tạo URL đính kèm icon của Webhook
 */
function getEmbedIconUrl(game) {
  return `attachment://${getIconFileName(game)}`;
}

/**
 * Lấy tiêu đề đề mục cho tác giả (Author Header)
 */
function getEmbedHeader(game) {
  const t = getLocale();

  if (game.alertType === "event") {
    return t.header_event;
  }

  if (game.alertType === "sale") {
    return t.header_sale;
  }

  if (game.alertType === "upcoming") {
    return t.header_upcoming;
  }

  return t.header_free;
}

/**
 * Xác định tên file icon đính kèm tương ứng nền tảng/alertType
 */
function getIconFileName(game) {
  const platform = (game.platform || "").toLowerCase();

  if (platform.includes("steam")) {
    return ICON_FILES.steam;
  }

  if (platform.includes("epic")) {
    return ICON_FILES.epic;
  }

  if (platform.includes("gog")) {
    return ICON_FILES.gog;
  }

  if (platform.includes("ubisoft")) {
    return ICON_FILES.ubisoft;
  }

  if (game.alertType === "event") {
    return ICON_FILES.event;
  }

  return game.alertType === "sale" ? ICON_FILES.sale : ICON_FILES.free;
}

/**
 * Lấy đường dẫn vật lý của file icon
 */
function getIconFile(game) {
  return path.join(__dirname, "..", "assets", "icons", getIconFileName(game));
}

/**
 * Tạo object Embed theo định dạng Discord API
 */
function createEmbed(game) {
  return {
    author: {
      name: getEmbedHeader(game),
      icon_url: getEmbedIconUrl(game),
    },
    title: getEmbedTitle(game),
    description: getEmbedDescription(game),
    color: getEmbedColor(game),
    url: game.url,
    fields: getEmbedFields(game),
    image: game.image ? { url: game.image } : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Tạo các trường thông tin chi tiết (fields) cho Embed Discord với bố cục lưới tối ưu hóa
 */
function getEmbedFields(game) {
  const t = getLocale();

  if (game.alertType === "event") {
    return [
      {
        name: t.field_platform,
        value: game.platform || "Unknown",
        inline: true,
      },
      {
        name: t.field_end_date_event,
        value: game.endDate || "Unknown",
        inline: true,
      },
      {
        name: t.field_notes,
        value: game.summary || t.default_summary,
        inline: false,
      },
      {
        name: t.field_event_page,
        value: game.url ? `[${t.text_open_sale}](${game.url})` : "Unknown",
        inline: false,
      },
    ];
  }

  if (game.alertType === "upcoming") {
    const fields = [
      {
        name: t.field_platform,
        value: game.platform || "Unknown",
        inline: true,
      },
      {
        name: t.field_original_price,
        value: game.originalPrice || "Unknown",
        inline: true,
      },
      {
        name: t.field_start_date,
        value: game.startDate || "Unknown",
        inline: true,
      },
      {
        name: t.field_end_date_free,
        value: game.endDate || "Unknown",
        inline: true,
      },
    ];

    if (game.genres) {
      fields.push({
        name: t.field_genres,
        value: game.genres,
        inline: false, // Để thể loại dài ở dòng riêng biệt
      });
    }

    fields.push({
      name: t.field_link_store,
      value: game.url ? `[${t.text_view_store}](${game.url})` : "Unknown",
      inline: false,
    });

    return fields;
  }

  // Đối với game free hoặc game sale
  const fields = [
    {
      name: t.field_platform,
      value: game.platform || "Unknown",
      inline: true,
    },
    {
      name: t.field_original_price,
      value: game.originalPrice || "Unknown",
      inline: true,
    },
    {
      name: t.field_current_price,
      value: game.currentPrice || t.current_free,
      inline: true,
    },
  ];

  if (game.discountPercent) {
    fields.push({
      name: t.field_discount,
      value: `${game.discountPercent}%`,
      inline: true,
    });
  }

  if (game.reviews) {
    fields.push({
      name: t.field_reviews,
      value: game.reviews,
      inline: true,
    });
  }

  // Để ngày hết hạn ở một dòng riêng biệt, tránh bị ép chật chội
  fields.push({
    name: game.alertType === "sale" ? t.field_end_date_sale : t.field_end_date_free,
    value: game.endDate || "Unknown",
    inline: false,
  });

  // Để thể loại game ở dòng riêng biệt do chuỗi thể loại (genres) thường dài
  if (game.genres) {
    fields.push({
      name: t.field_genres,
      value: game.genres,
      inline: false,
    });
  }

  fields.push({
    name: t.field_link_claim,
    value: game.url ? `[${t.text_claim_game}](${game.url})` : "Unknown",
    inline: false,
  });

  return fields;
}

/**
 * Gửi tin nhắn Embed kèm icon cục bộ (Multipart/form-data) tới Discord Webhook
 */
async function sendGameEmbed(game) {
  const iconFile = getIconFile(game);
  const form = new FormData();
  const payload = {
    embeds: [createEmbed(game)],
  };

  const mentionRole = process.env.DISCORD_MENTION_ROLE;
  if (mentionRole) {
    payload.content = mentionRole;
  }

  form.append("payload_json", JSON.stringify(payload));
  form.append("files[0]", new Blob([fs.readFileSync(iconFile)], { type: "image/png" }), path.basename(iconFile));

  await postWebhook(
    getWebhookUrl(game),
    form,
    {
      headers: form.getHeaders ? form.getHeaders() : undefined,
    },
  );
}

/**
 * Gửi gom nhóm các deal sale của cùng một nền tảng (tối đa 10 deal trong 1 payload)
 */
async function sendGameSalesBatch(games) {
  if (!games || games.length === 0) {
    return;
  }

  // Discord chỉ cho phép tối đa 10 embeds trong một tin nhắn
  const batch = games.slice(0, 10);
  const firstGame = batch[0];
  const iconFile = getIconFile(firstGame);
  const form = new FormData();
  
  const payload = {
    embeds: batch.map((game) => createEmbed(game)),
  };

  const mentionRole = process.env.DISCORD_MENTION_ROLE;
  if (mentionRole) {
    payload.content = mentionRole;
  }

  form.append("payload_json", JSON.stringify(payload));
  form.append("files[0]", new Blob([fs.readFileSync(iconFile)], { type: "image/png" }), path.basename(iconFile));

  await postWebhook(
    getWebhookUrl(firstGame),
    form,
    {
      headers: form.getHeaders ? form.getHeaders() : undefined,
    },
  );
}

module.exports = {
  getWebhookUrl,
  postWebhook,
  sendDiscordMessage,
  sendGameEmbed,
  sendGameSalesBatch,
};
