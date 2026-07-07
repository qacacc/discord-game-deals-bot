const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { loadSentGames } = require("./storage/sent.storage");
const { sendGameEmbed } = require("./services/discord.service");

// Nạp file cấu hình .env
require("dotenv").config({ quiet: true });

const token = process.env.DISCORD_BOT_TOKEN;
const prefix = process.env.DISCORD_BOT_PREFIX || "!";
const cooldownSec = Number(process.env.DISCORD_BOT_COOLDOWN_SEC) || 5;

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
  console.log(`======================================================\n`);
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
        .setTitle("🤖 HƯỚNG DẪN ĐIỀU KHIỂN BOT GAME")
        .setDescription(`Chào **${message.author.username}**, dưới đây là danh sách các lệnh bạn có thể nhắn trực tiếp để ra lệnh cho bot:`)
        .setColor(0x3498db)
        .addFields(
          { name: `\`${prefix}stats\``, value: "Hiển thị biểu đồ ASCII thống kê tỉ lệ game đã gửi.", inline: false },
          { name: `\`${prefix}check <tên game>\``, value: "Tra cứu lịch sử xem game đã được gửi hay chưa.", inline: false },
          { name: `\`${prefix}search <tên game>\``, value: "Tìm kiếm so sánh giá game trực tuyến trên Steam và Epic.", inline: false },
          { name: `\`${prefix}webhooks\``, value: "Kiểm tra kết nối và trạng thái hoạt động các Webhook.", inline: false },
          { name: `\`${prefix}changelog\``, value: "Gửi tin thông báo cập nhật v1.0.0 lên Discord.", inline: false },
          { name: `\`${prefix}send <tên> | <url> | [nền tảng] | [loại]\``, value: "Gửi nhanh một tin nhắn game tùy chọn lên Discord (Ngăn cách các tham số bằng dấu `|`).", inline: false }
        )
        .setFooter({ text: "Bot Game v1.0.0 - Advanced Coding Team" })
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
      let chartText = "======================================================\n";
      chartText += "          BIỂU ĐỒ PHÂN BỔ GAME ĐÃ GỬI (STATS CHART)\n";
      chartText += "======================================================\n\n";

      Object.entries(stats).forEach(([platform, count]) => {
        const percent = Math.round((count / total) * 100);
        const barLength = Math.round(percent / 5);
        const bar = "█".repeat(barLength) + "░".repeat(20 - barLength);
        chartText += `${platform.padEnd(20)}: ${bar} ${count} game (${percent}%)\n`;
      });
      
      chartText += `\nTổng số game đã ghi nhận: ${total} game.\n`;
      chartText += "======================================================";

      await message.reply(`\`\`\`text\n${chartText}\n\`\`\``);
      break;
    }

    case "check": {
      const query = args.join(" ");
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
        endDate: "Thông tin nâng cấp",
        summary: `🎉 Bot đã được nâng cấp thành công lên phiên bản **v1.0.0** với các tính năng mới:
• 🎮 **Hỗ trợ thêm nguồn game**: Ubisoft Connect, GOG.com, Itch.io, IndieGala, Xbox.
• 📉 **Bộ lọc thông minh**: Lọc theo giá bán tối đa mong muốn và thể loại game yêu thích.
• 💵 **Đa tiền tệ**: Tự động chuyển vùng giá giữa VNĐ (₫) và USD ($).
• 📦 **Gom nhóm tin nhắn**: Gộp nhiều deal sale cùng lúc giúp kênh chat gọn gàng.
• 🛠️ **Công cụ quản trị CLI**: Hỗ trợ xem bảng thống kê, tìm kiếm deal, kiểm tra webhook và chat-bot tự động gửi tin nhắn tùy chọn từ console.

💻 **BỘ LỆNH ĐIỀU KHIỂN CLI NHANH (ADMIN TOOLS):**
\`\`\`bash
# Xem bảng lịch sử game đã gửi
npm run show-history

# Vẽ biểu đồ ASCII thống kê game
npm run stats-chart

# Trình soạn tin tương tác gửi game
npm run send-custom

# Kiểm tra sức khỏe các Webhook
npm run check-webhooks
\`\`\``,
        url: "https://github.com/",
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
      const query = args.join(" ");
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
