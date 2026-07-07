const fs = require("fs");
const path = require("path");
const { loadSentGames, saveSentGames } = require("../src/storage/sent.storage");
const { sendGameEmbed } = require("../src/services/discord.service");

// Nạp file env cấu hình local
require("dotenv").config({ quiet: true });

const args = process.argv.slice(2);
const command = args[0];

function printUsage() {
  console.log(`
======================================================
              BOT GAME ADMIN CLI TOOLS
======================================================
Hướng dẫn sử dụng:
  npm run cli-tool <lệnh> [tham số]

Danh sách các lệnh:
  show         Hiển thị bảng danh sách các game đã gửi lưu trong sent.json.
  clean        Chủ động dọn dẹp các deal sale/event cũ quá 30 ngày.
  reset        Xóa sạch hoàn toàn lịch sử đã gửi (reset sent.json).
  check <từ_khóa>
               Tìm kiếm trong lịch sử xem game đã gửi chưa (theo tên hoặc ID).
  send "<tên_game>" "<link_url>" [nền_tảng] [loại_alert]
               Gửi trực tiếp 1 tin nhắn test game tùy chỉnh lên Discord.
               - nền_tảng: Steam, Epic, GOG, Ubisoft (mặc định: Steam)
               - loại_alert: free, sale, upcoming, event (mặc định: free)

Ví dụ:
  npm run cli-tool show
  npm run cli-tool check "Cyberpunk"
  npm run cli-tool send "Portal 2" "https://store.steampowered.com/app/620/Portal_2/" "Steam" "sale"
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
      
      // Định dạng bảng hiển thị đẹp mắt
      const tableData = list.map((item) => {
        // Hỗ trợ tương thích ngược nếu là chuỗi ID cũ
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
      // Hàm saveSentGames đã được tích hợp sẵn cơ chế dọn dẹp các deal sale/event > 30 ngày
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
        console.log("Lỗi: Vui lòng nhập từ khóa tìm kiếm. (Ví dụ: npm run cli-tool check \"Portal\")");
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
        console.log("Cú pháp: npm run cli-tool send \"<tên_game>\" \"<link_url>\" [nền_tảng] [loại_alert]");
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
        image: "https://images.gog-statics.com/cover.jpg", // Dùng ảnh bìa test mặc định
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

    default:
      console.log(`Không tìm thấy lệnh "${command}".`);
      printUsage();
  }
}

main().catch((err) => {
  console.error("CLI Tool Error:", err.message);
});
