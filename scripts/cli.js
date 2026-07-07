const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { loadSentGames, saveSentGames } = require("../src/storage/sent.storage");
const { sendGameEmbed } = require("../src/services/discord.service");

// Nạp file env cấu hình local
require("dotenv").config({ quiet: true });

const args = process.argv.slice(2);
const command = args[0];

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function printUsage() {
  console.log(`
======================================================
              BOT GAME ADMIN CLI TOOLS
======================================================
Hướng dẫn sử dụng:
  npm run cli-tool <lệnh> [tham số]

Danh sách các lệnh:
  show            Hiển thị bảng danh sách các game đã gửi lưu trong sent.json.
  clean           Chủ động dọn dẹp các deal sale/event cũ quá 30 ngày.
  reset           Xóa sạch hoàn toàn lịch sử đã gửi (reset sent.json).
  check <từ_khóa>
                  Tìm kiếm trong lịch sử xem game đã gửi chưa (theo tên hoặc ID).
  send-test -- "<tên>" "<url>" [nền_tảng] [loại_alert]
                  Gửi nhanh 1 tin nhắn test game lên Discord.
  send-custom     [Interactive] Mở giao diện trò chuyện hỏi-đáp trực tiếp để
                  soạn và gửi tin nhắn game tùy chọn bất kỳ lên Discord.
  stats-chart     In biểu đồ cột dạng ký tự ASCII thể hiện phân bổ các game đã gửi.
  check-webhooks  Kiểm tra trạng thái kết nối và phản hồi từ các Webhook Discord.
  send-changelog  Gửi tin nhắn thông báo Changelog cập nhật v1.0.0 lên Discord.

Ví dụ:
  npm run cli-tool show
  npm run cli-tool stats-chart
  npm run send-custom
======================================================
  `);
}

async function main() {
  if (!command) {
    printUsage();
    return;
  }

  const sentPath = path.join(__dirname, "..", "src", "storage", "sent.json");

  switch (command.toLowerCase()) {
    case "show": {
      const data = loadSentGames();
      const list = data.sent || [];
      if (list.length === 0) {
        console.log("Lịch sử gửi game đang trống.");
        return;
      }
      console.log(`\nDanh sách game đã gửi (${list.length} game):`);
      
      const tableData = list.map((item) => {
        if (typeof item === "string") {
          return { "ID Game": item, "Tên Game": "Lịch sử cũ", "Nền tảng": "Unknown", "Thời điểm gửi": "N/A" };
        }
        return {
          "ID Game": item.id,
          "Tên Game": item.title || "Unknown",
          "Nền tảng": item.platform || "Unknown",
          "Thời điểm gửi": item.sentAt ? new Date(item.sentAt).toLocaleString("vi-VN") : "N/A",
        };
      });
      console.table(tableData);
      break;
    }

    case "clean": {
      console.log("Đang bắt đầu dọn dẹp lịch sử deal cũ...");
      const data = loadSentGames();
      saveSentGames(data);
      console.log("Dọn dẹp lịch sử thành công!");
      break;
    }

    case "reset": {
      const emptyData = { sent: [] };
      fs.writeFileSync(sentPath, JSON.stringify(emptyData, null, 2), "utf8");
      console.log("Đã xoá sạch hoàn toàn lịch sử đã gửi trong sent.json!");
      break;
    }

    case "check": {
      const query = args[1];
      if (!query) {
        console.log("Lỗi: Vui lòng nhập từ khóa tìm kiếm.");
        return;
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
        console.log(`Không tìm thấy game nào chứa từ khóa "${query}" trong lịch sử.`);
      } else {
        console.log(`Tìm thấy ${results.length} kết quả trùng khớp:`);
        console.table(
          results.map((item) => {
            if (typeof item === "string") {
              return { ID: item, Tên: "Lịch sử cũ", "Nền tảng": "Unknown" };
            }
            return {
              ID: item.id,
              Tên: item.title,
              "Nền tảng": item.platform,
              "Gửi lúc": item.sentAt ? new Date(item.sentAt).toLocaleString("vi-VN") : "N/A",
            };
          })
        );
      }
      break;
    }

    case "send": {
      const title = args[1];
      const url = args[2];
      const platform = args[3] || "Steam";
      const alertType = args[4] || "free";

      if (!title || !url) {
        console.log("Lỗi: Thiếu tham số Tên Game hoặc URL.");
        return;
      }

      console.log(`Đang chuẩn bị gửi tin nhắn test: [${alertType}] [${platform}] ${title}...`);
      
      const gameMock = {
        id: `custom:test-${Date.now()}`,
        title,
        alertType,
        platform,
        originalPrice: alertType === "free" ? "Free" : "100.000₫",
        currentPrice: alertType === "free" ? "Free" : "20.000₫",
        discountPercent: alertType === "sale" ? 80 : undefined,
        endDate: alertType === "event" ? "Thời gian sự kiện" : "Xem trên store",
        url,
        image: "https://images.gog-statics.com/cover.jpg",
        genres: "Action, Adventure, Indie",
      };

      try {
        await sendGameEmbed(gameMock);
        console.log("Gửi tin nhắn test lên Discord thành công!");
      } catch (error) {
        console.error("Gửi tin nhắn test thất bại:", error.message);
      }
      break;
    }

    case "send-custom": {
      console.log("\n======================================================");
      console.log("    TRÌNH SOẠN TIN NHẮN TƯƠNG TÁC GỬI GAME CUSTOM");
      console.log("======================================================\n");
      
      const title = await askQuestion("1. Nhập tên game: ");
      if (!title) {
        console.log("Hủy bỏ lệnh.");
        return;
      }
      
      const url = await askQuestion("2. Nhập link URL: ");
      if (!url) {
        console.log("Hủy bỏ lệnh.");
        return;
      }

      const platform = await askQuestion("3. Chọn nền tảng (Steam/Epic/GOG/Ubisoft/Other) [Steam]: ") || "Steam";
      const alertType = await askQuestion("4. Chọn loại alert (free/sale/upcoming/event) [free]: ") || "free";
      const originalPrice = await askQuestion("5. Nhập giá gốc (ví dụ: 100.000₫ hoặc 10 USD) [Free]: ") || "Free";
      const currentPrice = await askQuestion("6. Nhập giá khuyến mại [Free]: ") || "Free";
      const discountPercent = alertType === "sale" ? (Number(await askQuestion("7. Nhập tỷ lệ giảm giá % (ví dụ: 80): ")) || undefined) : undefined;
      const genres = await askQuestion("8. Nhập thể loại game (ví dụ: Action, RPG): ") || undefined;
      const image = await askQuestion("9. Nhập URL ảnh bìa (để trống nếu dùng ảnh mặc định): ") || "https://images.gog-statics.com/cover.jpg";

      const gameMock = {
        id: `custom:interactive-${Date.now()}`,
        title,
        alertType,
        platform,
        originalPrice,
        currentPrice,
        discountPercent,
        endDate: alertType === "event" ? "Thời gian sự kiện" : "Xem trên store",
        url,
        image,
        genres,
      };

      console.log("\nĐang gửi game custom lên Discord...");
      try {
        await sendGameEmbed(gameMock);
        console.log(">>> Gửi game custom thành công!");
      } catch (err) {
        console.error(">>> Gửi game custom thất bại:", err.message);
      }
      break;
    }

    case "stats-chart": {
      const data = loadSentGames();
      const list = data.sent || [];
      if (list.length === 0) {
        console.log("Không có dữ liệu lịch sử để thống kê.");
        return;
      }
      const stats = {};
      list.forEach((item) => {
        const platform = typeof item === "string" ? "Unknown" : (item.platform || "Unknown");
        stats[platform] = (stats[platform] || 0) + 1;
      });

      console.log("\n======================================================");
      console.log("          BIỂU ĐỒ PHÂN BỔ GAME ĐÃ GỬI (STATS CHART)");
      console.log("======================================================\n");
      const total = list.length;
      Object.entries(stats).forEach(([platform, count]) => {
        const percent = Math.round((count / total) * 100);
        const barLength = Math.round(percent / 5);
        const bar = "█".repeat(barLength) + "░".repeat(20 - barLength);
        console.log(`${platform.padEnd(20)}: ${bar} ${count} game (${percent}%)`);
      });
      console.log(`\nTổng số game đã ghi nhận: ${total} game.`);
      console.log("======================================================\n");
      break;
    }

    case "check-webhooks": {
      console.log("\nĐang kiểm tra kết nối các Webhook Discord...");
      const webhooks = {
        DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
        EPIC_DISCORD_WEBHOOK_URL: process.env.EPIC_DISCORD_WEBHOOK_URL,
        STEAM_DISCORD_WEBHOOK_URL: process.env.STEAM_DISCORD_WEBHOOK_URL,
        OTHER_DISCORD_WEBHOOK_URL: process.env.OTHER_DISCORD_WEBHOOK_URL,
      };

      for (const [name, url] of Object.entries(webhooks)) {
        if (!url) {
          console.log(`- ${name.padEnd(30)}: [TRỐNG] (Sẽ fallback về webhook chung)`);
          continue;
        }
        try {
          const { fetchWithRetry } = require("../src/utils/request");
          const res = await fetchWithRetry(url, { method: "GET", timeout: 10_000 });
          if (res.status === 200) {
            console.log(`- ${name.padEnd(30)}: [HOẠT ĐỘNG] - Kênh: #${res.data?.name || "Unknown"}`);
          } else {
            console.log(`- ${name.padEnd(30)}: [LỖI] - HTTP ${res.status}`);
          }
        } catch (err) {
          console.log(`- ${name.padEnd(30)}: [THẤT BẠI] - ${err.message}`);
        }
      }
      console.log("");
      break;
    }

    case "send-changelog": {
      console.log("Đang gửi thông báo bản cập nhật Changelog v1.0.0 lên Discord...");
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
• 🛠️ **Công cụ quản trị CLI**: Hỗ trợ xem bảng thống kê, tìm kiếm deal, kiểm tra webhook và chat-bot tự động gửi tin nhắn tùy chọn từ console.`,
        url: "https://github.com/",
      };
      try {
        await sendGameEmbed(changelogMock);
        console.log("Đã gửi thông báo Changelog lên Discord thành công!");
      } catch (err) {
        console.error("Gửi thông báo Changelog thất bại:", err.message);
      }
      break;
    }

    default:
      console.log(`Không tìm thấy lệnh "${command}".`);
      printUsage();
  }
}

main().catch((err) => {
  console.error("CLI Tool Error:", err.message);
});
