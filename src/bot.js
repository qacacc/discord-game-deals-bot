const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { loadSentGames } = require("./storage/sent.storage");
const { sendGameEmbed } = require("./services/discord.service");

// Nạp file cấu hình .env
require("dotenv").config({ quiet: true });

// Tạo HTTP server nhỏ phục vụ việc deploy cloud miễn phí (như Render, Koyeb) để giữ kết nối
const http = require("http");
const HTTP_PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is online!");
}).listen(HTTP_PORT, () => {
  console.log(`🤖 Mini HTTP Server đang chạy trên cổng ${HTTP_PORT} để duy trì online.`);
});

const token = process.env.DISCORD_BOT_TOKEN;
const prefix = process.env.DISCORD_BOT_PREFIX || "!";
const cooldownSec = Number(process.env.DISCORD_BOT_COOLDOWN_SEC) || 5;
const botFreeEventOnly = (process.env.DISCORD_BOT_FREE_EVENT_ONLY || "true").toLowerCase() !== "false";

/**
 * Làm sạch tham số lệnh Discord.
 * Ví dụ: người dùng gõ theo mẫu `!search <Palworld>` thì bot chỉ lấy `Palworld`.
 */
function cleanCommandQuery(value) {
  return String(value || "")
    .trim()
    .replace(/^<+/, "")
    .replace(/>+$/, "")
    .trim()
    .replace(/\s+/g, " ");
}

if (!token) {
  console.error("Lỗi: Chưa cấu hình DISCORD_BOT_TOKEN trong file .env!");
  console.error("Vui lòng cấu hình token bot trước khi khởi động.");
  process.exit(1);
}

// Khởi tạo Discord Client Gateway
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Map lưu trữ thời gian cooldown của người dùng
const cooldowns = new Map();

client.once("clientReady", () => {
  console.log(`\n======================================================`);
  console.log(`🤖 Discord Bot Client đã trực tuyến thành công!`);
  console.log(`🤖 Tên Bot: ${client.user.tag}`);
  console.log(`🤖 Tiền tố lệnh (Prefix): "${prefix}"`);
  console.log(`🤖 Thời gian chờ (Cooldown): ${cooldownSec} giây`);
  console.log(`🤖 Chế độ auto: ${botFreeEventOnly ? "Chỉ Steam/Epic event + game free" : "Theo cấu hình .env đầy đủ"}`);
  console.log(`======================================================\n`);
  
  // Chạy quét game tự động ngay lập tức lần đầu tiên khi bot khởi động
  runAutoChecker();
});

client.on("messageCreate", async (message) => {
  // Bỏ qua tin nhắn từ các bot khác hoặc tin nhắn không bắt đầu bằng prefix
  if (message.author.bot || !message.content.startsWith(prefix)) {
    return;
  }

  // Tách lệnh và đối số
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Áp dụng cơ chế Cooldown chống spam & Rate Limit
  const now = Date.now();
  const cooldownAmount = cooldownSec * 1000;

  if (cooldowns.has(message.author.id)) {
    const expirationTime = cooldowns.get(message.author.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
      return message.reply(`⚠️ Vui lòng chờ **${timeLeft}s** để tránh Spam & Rate Limit của Discord!`);
    }
  }

  // Đăng ký cooldown cho người dùng hiện tại
  cooldowns.set(message.author.id, now);
  setTimeout(() => cooldowns.delete(message.author.id), cooldownAmount);

  // Xử lý các lệnh chat
  switch (command) {
    case "help": {
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Bot Game Deal", iconURL: client.user.displayAvatarURL() })
        .setTitle("Bảng điều khiển")
        .setDescription(`Xin chào **${message.author.username}**. Dùng các lệnh dưới đây để kiểm tra trạng thái và điều khiển bot.`)
        .setColor(0x3498db)
        .addFields(
          {
            name: "Giám sát",
            value: [
              `\`${prefix}mode\` - Xem chế độ tự động hiện tại`,
              `\`${prefix}stats\` - Xem thống kê game đã gửi`,
              `\`${prefix}webhooks\` - Kiểm tra kết nối webhook`,
            ].join("\n"),
            inline: false,
          },
          {
            name: "Tra cứu",
            value: [
              `\`${prefix}check <tên game>\` - Kiểm tra lịch sử đã gửi`,
              `\`${prefix}search <tên game>\` - Tìm giá trên Steam/Epic`,
            ].join("\n"),
            inline: false,
          },
          {
            name: "Quản trị",
            value: [
              `\`${prefix}send <tên> | <url> | [nền tảng] | [loại]\` - Gửi tin thủ công`,
              `\`${prefix}changelog\` - Gửi thông báo cập nhật`,
            ].join("\n"),
            inline: false,
          },
        )
        .setFooter({ text: `Prefix hiện tại: ${prefix}  •  Bot Game Deal` })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      break;
    }

    case "mode": {
      const embed = new EmbedBuilder()
        .setTitle("⚙️ CHẾ ĐỘ TỰ ĐỘNG CỦA BOT")
        .setColor(botFreeEventOnly ? 0x2ecc71 : 0xf1c40f)
        .setDescription(
          botFreeEventOnly
            ? "Bot đang chỉ tự động thông báo **Steam/Epic event + game free**. Sale deal chi tiết và nền tảng khác không được gửi trong chế độ này."
            : "Bot đang chạy theo cấu hình `.env` đầy đủ.",
        )
        .addFields(
          { name: "Biến cấu hình", value: "`DISCORD_BOT_FREE_EVENT_ONLY`", inline: false },
          { name: "Giá trị hiện tại", value: String(botFreeEventOnly), inline: true },
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
      break;
    }

    case "stats": {
      const data = loadSentGames();
      const list = data.sent || [];
      if (list.length === 0) {
        return message.reply("Lịch sử gửi game hiện đang trống.");
      }

      const stats = {};
      list.forEach((item) => {
        const platform = typeof item === "string" ? "Unknown" : (item.platform || "Unknown");
        stats[platform] = (stats[platform] || 0) + 1;
      });

      const total = list.length;
      const embed = new EmbedBuilder()
        .setAuthor({ name: "Bot Game Deal", iconURL: client.user.displayAvatarURL() })
        .setTitle("Thống kê lịch sử gửi")
        .setDescription(`Bot đã ghi nhận **${total}** game/sự kiện trong lịch sử.`)
        .setColor(0x2ecc71)
        .setFooter({ text: "Dữ liệu lấy từ sent.json" })
        .setTimestamp();

      Object.entries(stats).forEach(([platform, count]) => {
        const percent = Math.round((count / total) * 100);
        const barLength = Math.max(1, Math.round(percent / 10));
        const bar = "■".repeat(barLength) + "□".repeat(10 - barLength);

        embed.addFields({
          name: platform,
          value: `${bar} **${count}** mục (${percent}%)`,
          inline: false,
        });
      });

      await message.reply({ embeds: [embed] });
      break;
    }

    case "check": {
      const query = cleanCommandQuery(args.join(" "));
      if (!query) {
        return message.reply(`⚠️ Cú pháp sai! Vui lòng nhập: \`${prefix}check <tên game>\``);
      }

      const data = loadSentGames();
      const list = data.sent || [];
      const queryLower = query.toLowerCase();

      const results = list.filter((item) => {
        if (typeof item === "string") {
          return item.toLowerCase().includes(queryLower);
        }
        return (
          (item.id && item.id.toLowerCase().includes(queryLower)) ||
          (item.title && item.title.toLowerCase().includes(queryLower))
        );
      });

      if (results.length === 0) {
        return message.reply(`❌ Không tìm thấy game nào chứa từ khóa "${query}" trong lịch sử.`);
      }

      let replyText = `🔍 Tìm thấy **${results.length}** kết quả trùng khớp:\n`;
      results.slice(0, 10).forEach((item, idx) => {
        if (typeof item === "string") {
          replyText += `${idx + 1}. ID: \`${item}\` (Lịch sử cũ)\n`;
        } else {
          const sentDate = item.sentAt ? new Date(item.sentAt).toLocaleString("vi-VN") : "N/A";
          replyText += `${idx + 1}. **${item.title}** [${item.platform}] - Gửi lúc: ${sentDate}\n`;
        }
      });

      if (results.length > 10) {
        replyText += `*...và ${results.length - 10} kết quả khác.*`;
      }

      await message.reply(replyText);
      break;
    }

    case "webhooks": {
      await message.reply("🔄 Đang tiến hành kiểm tra kết nối các Webhook...");
      
      const webhooks = {
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
        EPIC_DISCORD_WEBHOOK_URL: process.env.EPIC_DISCORD_WEBHOOK_URL,
        STEAM_DISCORD_WEBHOOK_URL: process.env.STEAM_DISCORD_WEBHOOK_URL,
        OTHER_DISCORD_WEBHOOK_URL: process.env.OTHER_DISCORD_WEBHOOK_URL,
      };

      let resultText = "📡 **BÁO CÁO TRẠNG THÁI WEBHOOKS:**\n";

      for (const [name, url] of Object.entries(webhooks)) {
        if (!url) {
          resultText += `➖ \`${name}\`: ⚪ [TRỐNG] (Sẽ fallback về webhook chung)\n`;
          continue;
        }
        try {
          const { fetchWithRetry } = require("./utils/request");
          const res = await fetchWithRetry(url, { method: "GET", timeout: 8_000 });
          if (res.status === 200) {
            resultText += `✅ \`${name}\`: 🟢 [HOẠT ĐỘNG] - Kênh: \`#${res.data?.name || "Unknown"}\`\n`;
          } else {
            resultText += `❌ \`${name}\`: 🔴 [LỖI] - HTTP ${res.status}\n`;
          }
        } catch (err) {
          resultText += `❌ \`${name}\`: 🔴 [THẤT BẠI] - ${err.message}\n`;
        }
      }

      await message.reply(resultText);
      break;
    }

    case "changelog": {
      const changelogMock = {
        id: `event:changelog-v100-${Date.now()}`,
        eventName: "Bản Cập Nhật Bot Game v1.0.0",
        alertType: "event",
        platform: "Hệ thống Bot",
        endDate: "v1.0.0",
        summary: [
          "Bot đã được cập nhật lên **v1.0.0**.",
          "",
          "**Điểm mới chính**",
          "• Báo game miễn phí và game sắp miễn phí.",
          "• Báo sự kiện Steam/Epic đang diễn ra.",
          "• Tách webhook theo từng nền tảng.",
          "• Chống gửi trùng bằng `sent.json`.",
          "• Thêm bộ lệnh quản trị: `!help`, `!mode`, `!stats`, `!webhooks`, `!search`.",
          "",
          "**Chế độ mặc định**",
          "Bot tự động gửi Steam/Epic event + game free, không spam sale detail.",
        ].join("\n"),
        url: "https://github.com/qacacc/discord-game-deals-bot",
      };

      try {
        await sendGameEmbed(changelogMock);
        await message.reply("✅ Đã gửi Embed Changelog thành công!");
      } catch (err) {
        await message.reply(`❌ Gửi Changelog thất bại: ${err.message}`);
      }
      break;
    }

    case "send": {
      const paramStr = args.join(" ");
      if (!paramStr) {
        return message.reply(`⚠️ Cú pháp sai! Vui lòng nhập:\n\`${prefix}send Tên Game | Link URL | [Nền tảng] | [Loại]\``);
      }

      const params = paramStr.split("|").map(p => p.trim());
      const title = params[0];
      const url = params[1];
      const platform = params[2] || "Steam";
      const alertType = params[3] || "free";

      if (!title || !url) {
        return message.reply(`⚠️ Thiếu tham số Tên Game hoặc Link URL!`);
      }

      const gameMock = {
        id: `custom:bot-chat-${Date.now()}`,
        title,
        alertType,
        platform,
        originalPrice: alertType === "free" ? "Free" : "100.000₫",
        currentPrice: alertType === "free" ? "Free" : "20.000₫",
        discountPercent: alertType === "sale" ? 80 : undefined,
        endDate: alertType === "event" ? "Thời gian sự kiện" : "Xem trên store",
        url,
        image: "https://images.gog-statics.com/cover.jpg",
        genres: "Action, Adventure",
      };

      try {
        await sendGameEmbed(gameMock);
        await message.reply(`✅ Đã gửi thành công Embed game: **${title}**!`);
      } catch (err) {
        await message.reply(`❌ Gửi game thất bại: ${err.message}`);
      }
      break;
    }

    case "search": {
      const query = cleanCommandQuery(args.join(" "));
      if (!query) {
        return message.reply(`⚠️ Cú pháp sai! Vui lòng nhập: \`${prefix}search <tên game>\``);
      }

      const msg = await message.reply("🔄 Đang tìm kiếm giá game trực tuyến trên Steam và Epic...");
      
      try {
        const { searchAllDeals } = require("./services/search.service");
        const results = await searchAllDeals(query);

        if (results.length === 0) {
          return msg.edit(`❌ Không tìm thấy deal nào cho game "${query}" trực tuyến.`);
        }

        const embed = new EmbedBuilder()
          .setTitle(`🔍 Kết quả so sánh giá: ${query}`)
          .setDescription(`Dưới đây là các deal game được tìm thấy từ Steam và Epic Games Store cho từ khóa **${query}**:`)
          .setColor(0x3498db)
          .setTimestamp();

        results.slice(0, 8).forEach((item) => {
          const discountLabel = item.discountPercent ? `[-${item.discountPercent}%]` : "";
          const value = `• **Giá hiện tại**: ${item.currentPrice} ${discountLabel}\n` +
                        `• **Giá gốc**: ${item.originalPrice}\n` +
                        `• **Link Store**: [Mở Store](${item.url})`;
          
          embed.addFields({
            name: `🛍️ [${item.store}] ${item.title}`,
            value: value,
            inline: false
          });
        });

        const firstImage = results.find(r => r.image)?.image;
        if (firstImage) {
          embed.setThumbnail(firstImage);
        }

        await msg.edit({ content: "✅ Tìm kiếm hoàn tất!", embeds: [embed] });
      } catch (err) {
        await msg.edit(`❌ Gặp lỗi khi tìm kiếm: ${err.message}`);
      }
      break;
    }
  }
});

client.login(token).catch((err) => {
  console.error("Lỗi đăng nhập Discord Bot Client:", err.message);
  process.exit(1);
});

// Hàm chạy kiểm tra và tự động gửi thông báo game
async function runAutoChecker() {
  console.log("🤖 [Auto Checker] Bắt đầu tự động quét game mới...");
  try {
    const { runChecker } = require("./index");
    await runChecker(
      botFreeEventOnly
        ? {
            epicEnabled: true,
            steamEnabled: true,
            gogEnabled: false,
            ubisoftEnabled: false,
            otherEnabled: false,
            freeAlertsEnabled: true,
            upcomingAlertsEnabled: true,
            eventAlertsEnabled: true,
            saleAlertsEnabled: true,
            sendSaleDetailsToDiscord: false,
          }
        : {},
    );
    console.log("🤖 [Auto Checker] Quét tự động hoàn tất!");
  } catch (err) {
    console.error("🤖 [Auto Checker] Quét tự động gặp lỗi:", err.message);
  }
}

// Tự động chạy quét game mới định kỳ mỗi 4 giờ (14.400.000 ms)
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
setInterval(runAutoChecker, FOUR_HOURS_MS);
