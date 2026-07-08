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
  other: "other.png",
};

const LOCALES = {
  vi: {
    header_event: "Sự kiện đang diễn ra",
    header_sale: "Deal nổi bật",
    header_upcoming: "Game sắp miễn phí",
    header_free: "Game miễn phí",
    desc_event: (platform) => `Sự kiện sale đang diễn ra trên **${platform}**.`,
    desc_sale: "Game đang giảm giá mạnh.",
    desc_upcoming: "Game sắp được nhận miễn phí trên Epic Games Store.",
    desc_free: "Game đang miễn phí để nhận.",
    field_status: "Trạng thái",
    field_platform: "Nền tảng",
    field_price: "Giá",
    field_discount: "Giảm giá",
    field_start_date: "Ngày nhận",
    field_end_date_free: "Hạn hết",
    field_end_date_sale: "Hạn hết",
    field_end_date_event: "Thời gian",
    field_link_store: "Mở liên kết",
    field_reviews: "Đánh giá",
    field_genres: "Thể loại",
    field_notes: "Ghi chú",
    text_open_sale: "Open in browser ↗",
    text_view_store: "Open in browser ↗",
    text_claim_game: "Claim game ↗",
    default_summary: "Bot sẽ gửi các deal nổi bật sau thông báo này.",
    label_free_now: "Đang miễn phí",
    label_upcoming: "Sắp miễn phí",
    label_sale: "Đang giảm giá",
    current_free: "Free",
    footer_source: "Bot Game Deal",
    time_prefix: "Thời gian",
  },
  en: {
    header_event: "Live event",
    header_sale: "Featured deal",
    header_upcoming: "Upcoming free game",
    header_free: "Free game",
    desc_event: (platform) => `Sale event is live on **${platform}**.`,
    desc_sale: "This game is deeply discounted.",
    desc_upcoming: "This game will be free soon on Epic Games Store.",
    desc_free: "This game is currently free to claim.",
    field_status: "Status",
    field_platform: "Platform",
    field_price: "Price",
    field_discount: "Discount",
    field_start_date: "Claim starts",
    field_end_date_free: "Ends",
    field_end_date_sale: "Ends",
    field_end_date_event: "Duration",
    field_link_store: "Open link",
    field_reviews: "Reviews",
    field_genres: "Genres",
    field_notes: "Notes",
    text_open_sale: "Open in browser ↗",
    text_view_store: "Open in browser ↗",
    text_claim_game: "Claim game ↗",
    default_summary: "Featured deals will be sent after this announcement.",
    label_free_now: "Free now",
    label_upcoming: "Upcoming free",
    label_sale: "On sale",
    current_free: "Free",
    footer_source: "Bot Game Deal",
    time_prefix: "Time",
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
      : process.env.OTHER_DISCORD_WEBHOOK_URL;
  const webhookUrl = platformWebhookUrl || process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "Missing webhook URL. Set EPIC_DISCORD_WEBHOOK_URL, STEAM_DISCORD_WEBHOOK_URL, OTHER_DISCORD_WEBHOOK_URL, or DISCORD_WEBHOOK_URL.",
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
  const customDescription = game.description || game.summary;

  if (customDescription) {
    return formatQuote(customDescription);
  }

  if (game.alertType === "event") {
    return formatQuote(t.desc_event(game.platform));
  }

  if (game.alertType === "sale") {
    return formatQuote(t.desc_sale);
  }

  if (game.alertType === "upcoming") {
    return formatQuote(t.desc_upcoming);
  }

  return formatQuote(t.desc_free);
}

/**
 * Lấy mã màu sắc tương ứng cho Embed
 */
function getEmbedColor(game) {
  return 0x2f81f7; // Xanh chủ đạo, tối giản theo style đen/trắng/xanh.
}

/**
 * Rút gọn text để embed không bị phình quá dài.
 */
function truncateText(text, maxLength = 700) {
  const cleanText = String(text || "").replace(/\s+/g, " ").trim();

  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  return `${cleanText.slice(0, maxLength - 1).trim()}…`;
}

/**
 * Tạo đoạn mô tả dạng quote giống các bot deal chuyên nghiệp.
 */
function formatQuote(text) {
  return truncateText(text, 900)
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

/**
 * Chuyển chuỗi thể loại thành tag ngắn, dễ scan.
 */
function formatGenres(genres) {
  if (!genres) {
    return "";
  }

  return String(genres)
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map((genre) => `\`${genre.toUpperCase()}\``)
    .join(" ");
}

/**
 * Tạo dòng giá gọn giống thẻ deal.
 */
function formatPriceLine(game) {
  const t = getLocale();
  const originalPrice = game.originalPrice && game.originalPrice !== "Unknown"
    ? `~~${game.originalPrice}~~`
    : "";
  const currentPrice = game.currentPrice || t.current_free;

  if (originalPrice) {
    return `${originalPrice} **${currentPrice}**`;
  }

  return `**${currentPrice}**`;
}

/**
 * Định dạng ngày hiển thị gọn: "Thời gian: 22:00 | 8/7/2026".
 */
function formatDisplayDate(value) {
  const t = getLocale();

  if (!value || value === "Unknown") {
    return "Unknown";
  }

  const rawValue = String(value).trim();
  const parsedDate = new Date(rawValue);

  if (!Number.isNaN(parsedDate.getTime()) && /T|\d{4}-\d{2}-\d{2}/.test(rawValue)) {
    const time = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(parsedDate);
    const date = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "numeric",
      month: "numeric",
      year: "numeric",
    }).format(parsedDate);

    return `${t.time_prefix}: ${time} | ${date}`;
  }

  const normalized = rawValue.replace(",", " ");
  const match = normalized.match(/(\d{1,2}:\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);

  if (match) {
    const [, time, day, month, year] = match;
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${t.time_prefix}: ${time} | ${Number(day)}/${Number(month)}/${fullYear}`;
  }

  return rawValue;
}

/**
 * Tạo footer có nguồn và nhà phát hành nếu dữ liệu nguồn có trả về.
 */
function getEmbedFooter(game) {
  const t = getLocale();
  const parts = [`via ${t.footer_source}`];

  if (game.publisher) {
    parts.push(game.publisher);
  } else if (game.developer) {
    parts.push(game.developer);
  }

  return { text: parts.join("  •  ") };
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

  if (platform.includes("itch.io") || platform.includes("indiegala") || platform.includes("xbox") || platform.includes("playstation") || platform.includes("pc game")) {
    return ICON_FILES.other;
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
  const embed = {
    author: {
      name: getEmbedHeader(game),
      icon_url: getEmbedIconUrl(game),
    },
    title: getEmbedTitle(game),
    description: getEmbedDescription(game),
    color: getEmbedColor(game),
    url: game.url,
    fields: getEmbedFields(game),
    thumbnail: {
      url: getEmbedIconUrl(game),
    },
    image: game.image ? { url: game.image } : undefined,
    footer: getEmbedFooter(game),
    timestamp: new Date().toISOString(),
  };

  return embed;
}

/**
 * Tạo các trường thông tin chi tiết (fields) cho Embed Discord với bố cục lưới tối ưu hóa
 */
function getEmbedFields(game) {
  const t = getLocale();

  if (game.alertType === "event") {
    const fields = [
      {
        name: t.field_platform,
        value: game.platform || "Unknown",
        inline: true,
      },
      {
        name: t.field_end_date_event,
        value: formatDisplayDate(game.endDate),
        inline: true,
      },
      {
        name: t.field_link_store,
        value: game.url ? `[${t.text_open_sale}](${game.url})` : "Unknown",
        inline: false,
      },
    ];

    if (!game.summary) {
      fields.splice(2, 0, {
        name: t.field_notes,
        value: truncateText(t.default_summary, 900),
        inline: false,
      });
    }

    return fields;
  }

  if (game.alertType === "upcoming") {
    const fields = [
      {
        name: t.field_status,
        value: `**${t.label_upcoming}**`,
        inline: false,
      },
      {
        name: t.field_start_date,
        value: formatDisplayDate(game.startDate),
        inline: true,
      },
      {
        name: t.field_end_date_free,
        value: formatDisplayDate(game.endDate),
        inline: true,
      },
      {
        name: t.field_platform,
        value: game.platform || "Unknown",
        inline: true,
      },
      {
        name: t.field_price,
        value: formatPriceLine(game),
        inline: true,
      },
    ];

    if (game.genres) {
      fields.push({
        name: t.field_genres,
        value: formatGenres(game.genres),
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
      name: t.field_status,
      value: game.alertType === "sale" ? `**${t.label_sale}**` : `**${t.label_free_now}**`,
      inline: false,
    },
  ];

  if (game.startDate) {
    fields.push({
      name: t.field_start_date,
      value: formatDisplayDate(game.startDate),
      inline: true,
    });
  }

  fields.push(
    {
      name: game.alertType === "sale" ? t.field_end_date_sale : t.field_end_date_free,
      value: formatDisplayDate(game.endDate),
      inline: true,
    },
    {
      name: t.field_platform,
      value: game.platform || "Unknown",
      inline: true,
    },
    {
      name: t.field_price,
      value: formatPriceLine(game),
      inline: true,
    },
  );

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

  // Để thể loại game ở dòng riêng biệt do chuỗi thể loại (genres) thường dài
  if (game.genres) {
    fields.push({
      name: t.field_genres,
      value: formatGenres(game.genres),
      inline: false,
    });
  }

  fields.push({
    name: t.field_link_store,
    value: game.url ? `[${game.alertType === "sale" ? t.text_view_store : t.text_claim_game}](${game.url})` : "Unknown",
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
