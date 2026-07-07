const fs = require("fs");
const path = require("path");
const { fetchWithRetry } = require("../utils/request");

const ICON_FILES = {
  epic: "epic.png",
  event: "event.png",
  free: "free.png",
  sale: "sale.png",
  steam: "steam.png",
};

/**
 * Lấy Webhook URL tương ứng với nền tảng của game
 */
function getWebhookUrl(game = {}) {
  const platform = (game.platform || "").toLowerCase();
  const platformWebhookUrl = platform.includes("epic")
    ? process.env.EPIC_DISCORD_WEBHOOK_URL
    : platform.includes("steam")
      ? process.env.STEAM_DISCORD_WEBHOOK_URL
      : "";
  const webhookUrl = platformWebhookUrl || process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error(
      "Missing webhook URL. Set EPIC_DISCORD_WEBHOOK_URL, STEAM_DISCORD_WEBHOOK_URL, or DISCORD_WEBHOOK_URL.",
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
  if (game.alertType === "event") {
    return `Sự kiện sale đang diễn ra trên **${game.platform}**.`;
  }

  if (game.alertType === "sale") {
    return "Game đang giảm giá mạnh.";
  }

  if (game.alertType === "upcoming") {
    return "Game sắp được nhận miễn phí trên Epic Games Store.";
  }

  return "Game đang miễn phí để nhận.";
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
  if (game.alertType === "event") {
    return "Sự Kiện Sale Đang Diễn Ra";
  }

  if (game.alertType === "sale") {
    return "Game Đang Sale Mạnh";
  }

  if (game.alertType === "upcoming") {
    return "Game Sắp Miễn Phí";
  }

  return "Game Miễn Phí";
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
 * Tạo các trường thông tin chi tiết (fields) cho Embed Discord
 */
function getEmbedFields(game) {
  if (game.alertType === "event") {
    return [
      {
        name: "Nền tảng",
        value: game.platform || "Unknown",
        inline: true,
      },
      {
        name: "Thời gian",
        value: game.endDate || "Unknown",
        inline: true,
      },
      {
        name: "Ghi chú",
        value: game.summary || "Bot sẽ gửi các deal nổi bật sau thông báo này.",
        inline: false,
      },
      {
        name: "Trang sự kiện",
        value: game.url ? `[Mở trang sale](${game.url})` : "Unknown",
        inline: false,
      },
    ];
  }

  if (game.alertType === "upcoming") {
    return [
      {
        name: "Nền tảng",
        value: game.platform || "Unknown",
        inline: false,
      },
      {
        name: "Giá gốc",
        value: game.originalPrice || "Unknown",
        inline: false,
      },
      {
        name: "Bắt đầu tặng từ",
        value: game.startDate || "Unknown",
        inline: false,
      },
      {
        name: "Hạn nhận",
        value: game.endDate || "Unknown",
        inline: false,
      },
      {
        name: "Link cửa hàng",
        value: game.url ? `[Xem trên cửa hàng](${game.url})` : "Unknown",
        inline: false,
      },
    ];
  }

  const fields = [
    {
      name: "Nền tảng",
      value: game.platform || "Unknown",
      inline: false,
    },
    {
      name: "Giá gốc",
      value: game.originalPrice || "Unknown",
      inline: false,
    },
    {
      name: "Giá hiện tại",
      value: game.currentPrice || "Free",
      inline: false,
    },
  ];

  if (game.discountPercent) {
    fields.push({
      name: "Giảm giá",
      value: `${game.discountPercent}%`,
      inline: false,
    });
  }

  fields.push(
    {
      name: "Hạn nhận",
      value: game.endDate || "Unknown",
      inline: false,
    },
    {
      name: "Link nhận",
      value: game.url ? `[Nhận game](${game.url})` : "Unknown",
      inline: false,
    },
  );

  return fields;
}

/**
 * Gửi tin nhắn Embed kèm icon cục bộ (Multipart/form-data) tới Discord Webhook
 */
async function sendGameEmbed(game) {
  const iconFile = getIconFile(game);
  const form = new FormData();

  form.append(
    "payload_json",
    JSON.stringify({
      embeds: [createEmbed(game)],
    }),
  );
  form.append("files[0]", new Blob([fs.readFileSync(iconFile)], { type: "image/png" }), path.basename(iconFile));

  await postWebhook(
    getWebhookUrl(game),
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
};
