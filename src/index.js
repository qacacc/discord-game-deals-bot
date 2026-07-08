require("dotenv").config({ quiet: true });

const { getEpicFreeGames, getEpicUpcomingGames, getEpicSaleGames } = require("./services/epic.service");
const { getSteamFreeGames, getSteamSaleGames } = require("./services/steam.service");
const { getGogFreeGames } = require("./services/gog.service");
const { getUbisoftFreeGames } = require("./services/ubisoft.service");
const { getOtherFreeGames } = require("./services/other.service");
const { getActiveSaleEvents } = require("./services/event.service");
const { sendGameEmbed, sendGameSalesBatch } = require("./services/discord.service");
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
    gog: (f) => `- GOG.com:            ${f} Free`,
    ubisoft: (f) => `- Ubisoft Connect:    ${f} Free`,
    other: (f) => `- Nền tảng khác:      ${f} Free`,
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
    gog: (f) => `- GOG.com:            ${f} Free`,
    ubisoft: (f) => `- Ubisoft Connect:    ${f} Free`,
    other: (f) => `- Other Platforms:    ${f} Free`,
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
  console.log(t.gog(summary.gogFree));
  console.log(t.ubisoft(summary.ubisoftFree));
  console.log(t.other(summary.otherFree));
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
 * Hàm lọc game dựa trên các tiêu chí cấu hình cá nhân của người dùng (Giá / Thể loại)
 */
function filterByPreferences(game, { maxSalePrice, preferredGenres, excludedGenres }) {
  // 1. Lọc theo giá thành tối đa (chỉ áp dụng cho các deal giảm giá sale)
  if (game.alertType === "sale" && maxSalePrice > 0) {
    if (game.priceValue !== undefined && game.priceValue > maxSalePrice) {
      return false;
    }
  }

  // 2. Lọc theo thể loại game
  if (game.genres) {
    const gameGenres = game.genres.split(",").map((g) => g.trim().toLowerCase());

    // Kiểm tra danh sách thể loại loại trừ
    if (excludedGenres.length > 0) {
      const hasExcluded = gameGenres.some((genre) => excludedGenres.includes(genre));
      if (hasExcluded) {
        return false;
      }
    }

    // Kiểm tra danh sách thể loại ưu tiên (chỉ giữ lại các game có chứa ít nhất 1 thể loại ưu tiên)
    if (preferredGenres.length > 0) {
      const hasPreferred = gameGenres.some((genre) => preferredGenres.includes(genre));
      if (!hasPreferred) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Hàm kiểm tra và gửi game chính
 */
async function runChecker({
  getEpicGames = getEpicFreeGames,
  getEpicUpcoming = getEpicUpcomingGames,
  getSteamGames = getSteamFreeGames,
  getGogGames = getGogFreeGames,
  getUbisoftGames = getUbisoftFreeGames,
  getOtherGames = getOtherFreeGames,
  getEpicSales = getEpicSaleGames,
  getSteamSales = getSteamSaleGames,
  getSaleEvents = getActiveSaleEvents,
  sendGame = sendGameEmbed,
  sendSalesBatch = sendGameSalesBatch,
  loadSent = loadSentGames,
  saveSent = saveSentGames,
  dryRun = false,
  epicEnabled = readBooleanEnv("ENABLE_EPIC", true),
  steamEnabled = readBooleanEnv("ENABLE_STEAM", true),
  gogEnabled = readBooleanEnv("ENABLE_GOG", true),
  ubisoftEnabled = readBooleanEnv("ENABLE_UBISOFT", true),
  otherEnabled = readBooleanEnv("ENABLE_OTHER_PLATFORMS", true),
  freeAlertsEnabled = readBooleanEnv("ENABLE_FREE_ALERTS", true),
  upcomingAlertsEnabled = readBooleanEnv("ENABLE_UPCOMING_ALERTS", true),
  eventAlertsEnabled = readBooleanEnv("ENABLE_EVENT_ALERTS", true),
  saleAlertsEnabled = readBooleanEnv("SALE_ALERTS_ENABLED", true),
  sendSaleDetailsToDiscord = readBooleanEnv("SEND_SALE_DETAILS_TO_DISCORD", true),
  minSaleDiscountPercent = readNumberEnv("MIN_SALE_DISCOUNT_PERCENT", 80),
  maxSaleAlertsPerPlatform = readNumberEnv("MAX_SALE_ALERTS_PER_PLATFORM", 5),
  steamPagesCount = readNumberEnv("STEAM_PAGES_TO_SCAN", 3),
  maxSalePrice = readNumberEnv("MAX_SALE_PRICE", 0),
  preferredGenresStr = process.env.PREFERRED_GENRES || "",
  excludedGenresStr = process.env.EXCLUDED_GENRES || "",
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
  const gogGames = gogEnabled && freeAlertsEnabled ? await getGogGames() : [];
  const ubisoftGames = ubisoftEnabled && freeAlertsEnabled ? await getUbisoftGames() : [];
  const otherGames = otherEnabled && freeAlertsEnabled ? await getOtherGames() : [];

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
    ...gogGames,
    ...ubisoftGames,
    ...otherGames,
    ...saleEvents,
    ...(sendSaleDetailsToDiscord ? epicSales : []),
    ...(sendSaleDetailsToDiscord ? steamSales : []),
  ].map(normalizeGame);

  // Phân tích danh sách cấu hình thể loại
  const preferredGenres = preferredGenresStr ? preferredGenresStr.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean) : [];
  const excludedGenres = excludedGenresStr ? excludedGenresStr.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean) : [];

  // Áp dụng bộ lọc Giá & Thể loại theo mong muốn người dùng
  const filteredGames = allGames.filter((game) =>
    filterByPreferences(game, { maxSalePrice, preferredGenres, excludedGenres })
  );

  // Lọc ra các game chưa từng được gửi trước đây
  const newGames = filteredGames.filter((game) => !isGameSent(game.id, sentData));
  const duplicateCount = filteredGames.length - newGames.length;

  const summary = {
    checked: filteredGames.length,
    duplicates: duplicateCount,
    epicFree: epicGames.length,
    epicUpcoming: epicUpcoming.length,
    steamFree: steamGames.length,
    gogFree: gogGames.length,
    ubisoftFree: ubisoftGames.length,
    otherFree: otherGames.length,
    events: saleEvents.length,
    epicSales: epicSales.length,
    steamSales: steamSales.length,
  };

  if (newGames.length === 0) {
    console.log(t.none);
    printDetailedSummary({ ...summary, sent: 0 }, [], dryRun);
    return { checked: filteredGames.length, sent: 0, pending: 0, duplicates: duplicateCount };
  }

  // Phân loại game: Game sale (sẽ batching) và game khác (gửi đơn lẻ)
  const nonSaleGames = newGames.filter((game) => game.alertType !== "sale");
  const saleGames = newGames.filter((game) => game.alertType === "sale");

  // 1. Gửi các game quan trọng đơn lẻ (Free, Upcoming, Event)
  for (const game of nonSaleGames) {
    if (dryRun) {
      const label =
        game.alertType === "event"
          ? "Event"
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

  // 2. Gửi gom nhóm các deal sale theo nền tảng (Steam hoặc Epic)
  const epicSaleGames = saleGames.filter((g) => g.platform.toLowerCase().includes("epic"));
  const steamSaleGames = saleGames.filter((g) => g.platform.toLowerCase().includes("steam"));

  if (epicSaleGames.length > 0) {
    if (dryRun) {
      console.log(`[Dry run] [Batch] Epic Sales${sendSaleDetailsToDiscord ? "" : " (Chỉ thống kê)"}: ${epicSaleGames.map((g) => g.title).join(", ")}`);
    } else {
      try {
        if (sendSaleDetailsToDiscord) {
          await sendSalesBatch(epicSaleGames);
          console.log(`Sent Epic sales batch: ${epicSaleGames.map((g) => g.title).join(", ")}`);
        } else {
          console.log(`Logged Epic sales batch (Chỉ thống kê): ${epicSaleGames.map((g) => g.title).join(", ")}`);
        }
        epicSaleGames.forEach((g) => markGameAsSent(g, sentData));
      } catch (error) {
        console.error(`Error sending Epic sales batch to Discord:`, error.message);
      }
    }
  }

  if (steamSaleGames.length > 0) {
    if (dryRun) {
      console.log(`[Dry run] [Batch] Steam Sales${sendSaleDetailsToDiscord ? "" : " (Chỉ thống kê)"}: ${steamSaleGames.map((g) => g.title).join(", ")}`);
    } else {
      try {
        if (sendSaleDetailsToDiscord) {
          await sendSalesBatch(steamSaleGames);
          console.log(`Sent Steam sales batch: ${steamSaleGames.map((g) => g.title).join(", ")}`);
        } else {
          console.log(`Logged Steam sales batch (Chỉ thống kê): ${steamSaleGames.map((g) => g.title).join(", ")}`);
        }
        steamSaleGames.forEach((g) => markGameAsSent(g, sentData));
      } catch (error) {
        console.error(`Error sending Steam sales batch to Discord:`, error.message);
      }
    }
  }

  if (dryRun) {
    console.log(t.dry_done);
    printDetailedSummary({ ...summary, sent: 0, pending: newGames.length }, newGames, dryRun);
    return { checked: filteredGames.length, sent: 0, pending: newGames.length, duplicates: duplicateCount };
  }

  saveSent(sentData);

  console.log(t.done);
  printDetailedSummary({ ...summary, sent: newGames.length }, newGames, dryRun);

  return { checked: filteredGames.length, sent: newGames.length, pending: 0, duplicates: duplicateCount };
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
