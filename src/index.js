require("dotenv").config({ quiet: true });

const { getEpicFreeGames, getEpicUpcomingGames, getEpicSaleGames } = require("./services/epic.service");
const { getSteamFreeGames, getSteamSaleGames } = require("./services/steam.service");
const { getActiveSaleEvents } = require("./services/event.service");
const { sendGameEmbed } = require("./services/discord.service");
const { normalizeGame } = require("./utils/formatGame");

const {
  loadSentGames,
  saveSentGames,
  isGameSent,
  markGameAsSent,
} = require("./storage/sent.storage");

/**
 * Đọc giá trị Boolean từ biến môi trường
 */
function readBooleanEnv(name, defaultValue) {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

/**
 * Đọc giá trị Number từ biến môi trường
 */
function readNumberEnv(name, defaultValue) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : defaultValue;
}

/**
 * Hàm in ra thống kê chi tiết ở dạng bảng và Tiếng Việt đẹp mắt
 */
function printDetailedSummary(summary, newGames, dryRun) {
  console.log("\n=======================================================");
  console.log("                BÁO CÁO THỐNG KÊ (SUMMARY)");
  console.log("=======================================================");
  console.log("Trạng thái quét các nền tảng:");
  console.log(`- Epic Games Store:  ${summary.epicFree} Free | ${summary.epicUpcoming} Sắp Free | ${summary.epicSales} Sale`);
  console.log(`- Steam Store:       ${summary.steamFree} Free | ${summary.steamSales} Sale`);
  console.log(`- Sự kiện Sale lớn:  ${summary.events} đang hoạt động`);
  console.log("-------------------------------------------------------");
  console.log(`Tổng số deal quét được:  ${summary.checked}`);
  console.log(`Số game trùng (đã gửi):  ${summary.duplicates}`);
  console.log(`Số game mới phát hiện:   ${newGames.length}`);
  
  if (newGames.length > 0) {
    console.log("-------------------------------------------------------");
    console.log(dryRun ? "Danh sách game mới phát hiện (Chạy thử - Dry Run):" : "Danh sách game mới đã gửi lên Discord:");
    newGames.forEach((game, idx) => {
      const typeLabel = game.alertType === "free" ? "Miễn phí" : 
                        game.alertType === "upcoming" ? "Sắp miễn phí" : 
                        game.alertType === "sale" ? `Giảm giá ${game.discountPercent}%` : "Sự kiện";
      console.log(`  ${idx + 1}. [${typeLabel}] [${game.platform}] ${game.title}`);
    });
  }
  console.log("=======================================================\n");
}

/**
 * Hàm kiểm tra và gửi game chính
 */
async function runChecker({
  getEpicGames = getEpicFreeGames,
  getEpicUpcoming = getEpicUpcomingGames,
  getSteamGames = getSteamFreeGames,
  getEpicSales = getEpicSaleGames,
  getSteamSales = getSteamSaleGames,
  getSaleEvents = getActiveSaleEvents,
  sendGame = sendGameEmbed,
  loadSent = loadSentGames,
  saveSent = saveSentGames,
  dryRun = false,
  epicEnabled = readBooleanEnv("ENABLE_EPIC", true),
  steamEnabled = readBooleanEnv("ENABLE_STEAM", true),
  freeAlertsEnabled = readBooleanEnv("ENABLE_FREE_ALERTS", true),
  upcomingAlertsEnabled = readBooleanEnv("ENABLE_UPCOMING_ALERTS", true),
  eventAlertsEnabled = readBooleanEnv("ENABLE_EVENT_ALERTS", true),
  saleAlertsEnabled = readBooleanEnv("SALE_ALERTS_ENABLED", true),
  minSaleDiscountPercent = readNumberEnv("MIN_SALE_DISCOUNT_PERCENT", 80),
  maxSaleAlertsPerPlatform = readNumberEnv("MAX_SALE_ALERTS_PER_PLATFORM", 5),
  steamPagesCount = readNumberEnv("STEAM_PAGES_TO_SCAN", 3),
} = {}) {
  console.log("Đang bắt đầu quét game miễn phí và ưu đãi giảm giá sâu...");

  const sentData = loadSent();

  const epicGames = epicEnabled && freeAlertsEnabled ? await getEpicGames() : [];
  const epicUpcoming = epicEnabled && freeAlertsEnabled && upcomingAlertsEnabled ? await getEpicUpcoming() : [];
  const steamGames = steamEnabled && freeAlertsEnabled ? await getSteamGames({ pages: steamPagesCount }) : [];

  const epicSales = epicEnabled && saleAlertsEnabled
    ? await getEpicSales({
        minDiscountPercent: minSaleDiscountPercent,
        limit: maxSaleAlertsPerPlatform,
      })
    : [];

  const steamSales = steamEnabled && saleAlertsEnabled
    ? await getSteamSales({
        minDiscountPercent: minSaleDiscountPercent,
        limit: maxSaleAlertsPerPlatform,
        pages: steamPagesCount,
      })
    : [];

  const saleEvents = eventAlertsEnabled && saleAlertsEnabled
    ? getSaleEvents({
        steamSales,
        epicSales,
      })
    : [];

  // Hợp nhất toàn bộ game và sự kiện quét được
  const allGames = [
    ...epicGames,
    ...epicUpcoming,
    ...steamGames,
    ...saleEvents,
    ...epicSales,
    ...steamSales,
  ].map(normalizeGame);

  // Lọc ra các game chưa từng được gửi trước đây
  const newGames = allGames.filter((game) => !isGameSent(game.id, sentData));
  const duplicateCount = allGames.length - newGames.length;

  const summary = {
    checked: allGames.length,
    duplicates: duplicateCount,
    epicFree: epicGames.length,
    epicUpcoming: epicUpcoming.length,
    steamFree: steamGames.length,
    events: saleEvents.length,
    epicSales: epicSales.length,
    steamSales: steamSales.length,
  };

  if (newGames.length === 0) {
    console.log("Không phát hiện game mới hoặc ưu đãi giảm giá mới.");
    printDetailedSummary({ ...summary, sent: 0 }, [], dryRun);
    return { checked: allGames.length, sent: 0, pending: 0, duplicates: duplicateCount };
  }

  for (const game of newGames) {
    if (dryRun) {
      const label =
        game.alertType === "event"
          ? "Event"
          : game.alertType === "sale"
            ? `Sale ${game.discountPercent}%`
            : game.alertType === "upcoming"
              ? "Upcoming"
              : "Free";
      console.log(`[Dry run] [${label}] ${game.title} - ${game.url}`);
      continue;
    }

    try {
      await sendGame(game);
      markGameAsSent(game, sentData);
      console.log(`Đã gửi thành công: ${game.title}`);
    } catch (error) {
      console.error(`Lỗi khi gửi deal ${game.title} lên Discord:`, error.message);
    }
  }

  if (dryRun) {
    console.log("Chạy thử hoàn tất. Không có tin nhắn Discord nào được gửi và sent.json không đổi.");
    printDetailedSummary({ ...summary, sent: 0, pending: newGames.length }, newGames, dryRun);
    return { checked: allGames.length, sent: 0, pending: newGames.length, duplicates: duplicateCount };
  }

  saveSent(sentData);

  console.log("Hoàn tất xử lý.");
  printDetailedSummary({ ...summary, sent: newGames.length }, newGames, dryRun);

  return { checked: allGames.length, sent: newGames.length, pending: 0, duplicates: duplicateCount };
}

if (require.main === module) {
  runChecker({
    dryRun: process.argv.includes("--dry-run"),
  }).catch((error) => {
    console.error("Bot gặp lỗi nghiêm trọng:", error.message);
    process.exit(1);
  });
}

module.exports = {
  readBooleanEnv,
  readNumberEnv,
  runChecker,
};
