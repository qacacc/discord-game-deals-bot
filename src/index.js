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

const SUMMARY_LOCALES = {
  vi: {
    title: "                BÁO CÁO THỐNG KÊ (SUMMARY)",
    platforms: "Trạng thái quét các nền tảng:",
    epic: (f, u, s) => `- Epic Games Store:  ${f} Free | ${u} Sắp Free | ${s} Sale`,
    steam: (f, s) => `- Steam Store:       ${f} Free | ${s} Sale`,
    events: (e) => `- Sự kiện Sale lớn:  ${e} đang hoạt động`,
    total_checked: "Tổng số deal quét được:  ",
    total_duplicates: "Số game trùng (đã gửi):  ",
    total_new: "Số game mới phát hiện:   ",
    list_header_dry: "Danh sách game mới phát hiện (Chạy thử - Dry Run):",
    list_header_real: "Danh sách game mới đã gửi lên Discord:",
    free: "Miễn phí",
    upcoming: "Sắp miễn phí",
    sale: (d) => `Giảm giá ${d}%`,
    event: "Sự kiện",
    none: "Không phát hiện game mới hoặc ưu đãi giảm giá mới.",
    dry_done: "Chạy thử hoàn tất. Không có tin nhắn Discord nào được gửi và sent.json không đổi.",
    done: "Hoàn tất xử lý.",
    start_scanning: "Đang bắt đầu quét game miễn phí và ưu đãi giảm giá sâu..."
  },
  en: {
    title: "                     STATISTICS SUMMARY",
    platforms: "Platform scanning status:",
    epic: (f, u, s) => `- Epic Games Store:  ${f} Free | ${u} Upcoming | ${s} Sale`,
    steam: (f, s) => `- Steam Store:       ${f} Free | ${s} Sale`,
    events: (e) => `- Big Sale Events:   ${e} active`,
    total_checked: "Total deals scanned:     ",
    total_duplicates: "Duplicate deals (sent):  ",
    total_new: "New deals discovered:    ",
    list_header_dry: "List of new deals (Dry Run):",
    list_header_real: "List of new deals sent to Discord:",
    free: "Free",
    upcoming: "Upcoming Free",
    sale: (d) => `Sale ${d}%`,
    event: "Event",
    none: "No new games or deep discount deals found.",
    dry_done: "Dry run completed. No Discord messages sent and sent.json was not modified.",
    done: "Processing completed.",
    start_scanning: "Starting to scan for free games and deep discount deals..."
  }
};

/**
 * Lấy ngôn ngữ thống kê log
 */
function getSummaryLocale() {
  const locale = (process.env.MESSAGE_LOCALE || "vi").toLowerCase();
  return SUMMARY_LOCALES[locale] || SUMMARY_LOCALES.vi;
}

/**
 * Hàm in ra thống kê chi tiết ở dạng bảng đa ngôn ngữ
 */
function printDetailedSummary(summary, newGames, dryRun) {
  const t = getSummaryLocale();
  console.log("\n=======================================================");
  console.log(t.title);
  console.log("=======================================================");
  console.log(t.platforms);
  console.log(t.epic(summary.epicFree, summary.epicUpcoming, summary.epicSales));
  console.log(t.steam(summary.steamFree, summary.steamSales));
  console.log(t.events(summary.events));
  console.log("-------------------------------------------------------");
  console.log(`${t.total_checked}${summary.checked}`);
  console.log(`${t.total_duplicates}${summary.duplicates}`);
  console.log(`${t.total_new}${newGames.length}`);
  
  if (newGames.length > 0) {
    console.log("-------------------------------------------------------");
    console.log(dryRun ? t.list_header_dry : t.list_header_real);
    newGames.forEach((game, idx) => {
      const typeLabel = game.alertType === "free" ? t.free : 
                        game.alertType === "upcoming" ? t.upcoming : 
                        game.alertType === "sale" ? t.sale(game.discountPercent) : t.event;
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
  const t = getSummaryLocale();
  console.log(t.start_scanning);

  const sentData = loadSent();

  const epicGames = epicEnabled && freeAlertsEnabled ? await getEpicGames() : [];
  let epicUpcoming = epicEnabled && freeAlertsEnabled && upcomingAlertsEnabled ? await getEpicUpcoming() : [];

  // Loại bỏ các game sắp miễn phí trùng lặp với game đang miễn phí hiện tại để tránh tin nhắn trùng
  if (epicGames.length > 0 && epicUpcoming.length > 0) {
    const activeEpicIds = new Set(epicGames.map((g) => g.id.replace("epic:", "")));
    epicUpcoming = epicUpcoming.filter((g) => {
      const id = g.id.replace("epic-upcoming:", "");
      return !activeEpicIds.has(id);
    });
  }

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
    console.log(t.none);
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
      console.log(`Sent: ${game.title}`);
    } catch (error) {
      console.error(`Error sending deal ${game.title} to Discord:`, error.message);
    }
  }

  if (dryRun) {
    console.log(t.dry_done);
    printDetailedSummary({ ...summary, sent: 0, pending: newGames.length }, newGames, dryRun);
    return { checked: allGames.length, sent: 0, pending: newGames.length, duplicates: duplicateCount };
  }

  saveSent(sentData);

  console.log(t.done);
  printDetailedSummary({ ...summary, sent: newGames.length }, newGames, dryRun);

  return { checked: allGames.length, sent: newGames.length, pending: 0, duplicates: duplicateCount };
}

if (require.main === module) {
  runChecker({
    dryRun: process.argv.includes("--dry-run"),
  }).catch((error) => {
    console.error("Critical error:", error.message);
    process.exit(1);
  });
}

module.exports = {
  readBooleanEnv,
  readNumberEnv,
  runChecker,
};
