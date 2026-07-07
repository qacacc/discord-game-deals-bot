const axios = require("axios");
const fs = require("fs");
const path = require("path");

const ICON_FILES = {
  epic: "epic.png",
  event: "event.png",
  free: "free.png",
  sale: "sale.png",
  steam: "steam.png",
};

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

async function sendDiscordMessage(content) {
  await axios.post(
    getWebhookUrl(),
    { content },
    {
      timeout: 15_000,
      validateStatus: (status) => status >= 200 && status < 300,
    },
  );
}

function getEmbedTitle(game) {
  return game.eventName || game.title;
}

function getEmbedDescription(game) {
  if (game.alertType === "event") {
    return `Sự kiện sale đang diễn ra trên **${game.platform}**.`;
  }

  if (game.alertType === "sale") {
    return "Game đang giảm giá mạnh.";
  }

  return "Game đang miễn phí để nhận.";
}

function getEmbedColor(game) {
  if (game.alertType === "event") {
    return 0x3498db;
  }

  return game.alertType === "sale" ? 0xf1c40f : 0x2ecc71;
}

function getEmbedIconUrl(game) {
  return `attachment://${getIconFileName(game)}`;
}

function getEmbedHeader(game) {
  if (game.alertType === "event") {
    return "Sự Kiện Sale Đang Diễn Ra";
  }

  return game.alertType === "sale" ? "Game Đang Sale Mạnh" : "Game Miễn Phí";
}

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

function getIconFile(game) {
  return path.join(__dirname, "..", "assets", "icons", getIconFileName(game));
}

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

function getEmbedFields(game) {
  if (game.alertType === "event") {
    const eventFields = [
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

    return eventFields;
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

  await axios.post(
    getWebhookUrl(game),
    form,
    {
      timeout: 15_000,
      headers: form.getHeaders ? form.getHeaders() : undefined,
      validateStatus: (status) => status >= 200 && status < 300,
    },
  );
}

module.exports = {
  getWebhookUrl,
  sendDiscordMessage,
  sendGameEmbed,
};
