const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "sent.json");

/**
 * Tạo store trống mặc định
 */
function createEmptyStore() {
  return { sent: [] };
}

/**
 * Chuẩn hóa dữ liệu lịch sử để đảm bảo tương thích ngược
 * Chuyển các ID dạng chuỗi cũ sang cấu trúc object chi tiết.
 * Đồng thời tự động dọn dẹp các deal sale/event cũ hơn 30 ngày để tối ưu dung lượng.
 */
function normalizeStore(data) {
  if (!data || !Array.isArray(data.sent)) {
    return createEmptyStore();
  }

  const cutoffTime = new Date();
  cutoffTime.setDate(cutoffTime.getDate() - 30); // Ngưỡng dọn dẹp: 30 ngày

  const normalizedSent = data.sent
    .filter(Boolean)
    .map((item) => {
      if (typeof item === "string") {
        return {
          id: item,
          title: "Lịch sử cũ",
          platform: "Unknown",
          sentAt: new Date().toISOString(),
        };
      }
      return {
        id: item.id,
        title: item.title || "Unknown",
        platform: item.platform || "Unknown",
        sentAt: item.sentAt || new Date().toISOString(),
      };
    })
    .filter((item) => {
      const isSaleOrEvent = item.id.includes("sale") || item.id.includes("event");
      if (isSaleOrEvent) {
        // Loại bỏ các deal sale và thông báo event cũ hơn 30 ngày
        return new Date(item.sentAt) >= cutoffTime;
      }
      // Giữ lại các game free và game sắp free để tránh báo trùng lặp
      return true;
    });

  // Lọc trùng lặp theo ID
  const seenIds = new Set();
  const uniqueSent = normalizedSent.filter((item) => {
    if (!item.id || seenIds.has(item.id)) {
      return false;
    }
    seenIds.add(item.id);
    return true;
  });

  return {
    sent: uniqueSent,
  };
}

/**
 * Đọc dữ liệu đã gửi từ file sent.json
 */
function loadSentGames() {
  if (!fs.existsSync(filePath)) {
    return createEmptyStore();
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();

  if (!raw) {
    return createEmptyStore();
  }

  return normalizeStore(JSON.parse(raw));
}

/**
 * Lưu dữ liệu lịch sử xuống file sent.json
 */
function saveSentGames(data) {
  const normalized = normalizeStore(data);
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

/**
 * Kiểm tra xem game đã được gửi chưa
 */
function isGameSent(gameId, data) {
  if (!gameId) {
    return false;
  }
  const store = normalizeStore(data);
  return store.sent.some((item) => item.id === gameId);
}

/**
 * Đánh dấu game là đã gửi và lưu thông tin chi tiết vào lịch sử
 */
function markGameAsSent(game, data) {
  if (!game) {
    return;
  }

  if (!Array.isArray(data.sent)) {
    data.sent = [];
  }

  // Hỗ trợ truyền gameId dạng string (cho tương thích ngược và unit test cũ)
  const gameId = typeof game === "string" ? game : game.id;
  if (!gameId) {
    return;
  }

  const alreadySent = data.sent.some((item) => {
    if (typeof item === "string") {
      return item === gameId;
    }
    return item && item.id === gameId;
  });

  if (!alreadySent) {
    if (typeof game === "string") {
      data.sent.push({
        id: gameId,
        title: "Lịch sử cũ",
        platform: "Unknown",
        sentAt: new Date().toISOString(),
      });
    } else {
      data.sent.push({
        id: game.id,
        title: game.eventName || game.title || "Unknown",
        platform: game.platform || "Unknown",
        sentAt: new Date().toISOString(),
      });
    }
  }
}

module.exports = {
  loadSentGames,
  saveSentGames,
  isGameSent,
  markGameAsSent,
};
