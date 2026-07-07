const assert = require("node:assert/strict");
const test = require("node:test");

const {
  loadSentGames,
  saveSentGames,
  isGameSent,
  markGameAsSent,
} = require("../src/storage/sent.storage");

test("sent.storage don dep deal sale va event cu hon 30 ngay nhung giu lai game free", () => {
  const now = new Date();
  
  const oldSaleDate = new Date();
  oldSaleDate.setDate(now.getDate() - 35); // 35 ngày trước

  const recentSaleDate = new Date();
  recentSaleDate.setDate(now.getDate() - 10); // 10 ngày trước

  const oldFreeDate = new Date();
  oldFreeDate.setDate(now.getDate() - 40); // 40 ngày trước

  // Dữ liệu mock lịch sử
  const testData = {
    sent: [
      {
        id: "steam-sale:123:90:1000",
        title: "Old Sale Game",
        platform: "Steam",
        sentAt: oldSaleDate.toISOString()
      },
      {
        id: "epic-sale:456:85:2000",
        title: "Recent Sale Game",
        platform: "Epic Games Store",
        sentAt: recentSaleDate.toISOString()
      },
      {
        id: "event:steam-old-event-2026",
        title: "Old Sale Event",
        platform: "Steam",
        sentAt: oldSaleDate.toISOString()
      },
      {
        id: "epic:789",
        title: "Old Free Game",
        platform: "Epic Games Store",
        sentAt: oldFreeDate.toISOString()
      }
    ]
  };

  // Ghi nhận mock data
  const storage = require("../src/storage/sent.storage");
  
  // Chúng ta kiểm tra hàm normalizeStore gián tiếp qua isGameSent hoặc qua load/save
  // Ở đây ta có thể trực tiếp test hàm normalizeStore bằng cách require file hoặc xem cách nó export
  // Do normalizeStore không được export trong module.exports cũ, nhưng ta có thể check gián tiếp qua việc save và load
  // Hoặc ta chỉ cần kiểm tra xem các game cũ có còn tồn tại không.
  
  // Chúng ta gán dữ liệu và ghi trực tiếp
  storage.saveSentGames(testData);
  const loadedData = storage.loadSentGames();

  // Kiểm tra:
  // 1. "steam-sale:123:90:1000" (cũ > 30 ngày) -> Phải bị xoá
  assert.equal(storage.isGameSent("steam-sale:123:90:1000", loadedData), false);

  // 2. "event:steam-old-event-2026" (cũ > 30 ngày) -> Phải bị xoá
  assert.equal(storage.isGameSent("event:steam-old-event-2026", loadedData), false);

  // 3. "epic-sale:456:85:2000" (gần đây < 30 ngày) -> Phải giữ lại
  assert.equal(storage.isGameSent("epic-sale:456:85:2000", loadedData), true);

  // 4. "epic:789" (game free cũ > 30 ngày) -> Phải giữ lại vĩnh viễn
  assert.equal(storage.isGameSent("epic:789", loadedData), true);

  // Dọn dẹp trả lại sent.json trống sau khi test
  storage.saveSentGames({ sent: [] });
});
