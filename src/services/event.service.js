const STEAM_2026_EVENTS = [
  {
    id: "steam-spring-sale-2026",
    platform: "Steam",
    title: "Steam Spring Sale 2026",
    startsAt: "2026-03-19T00:00:00.000Z",
    endsAt: "2026-03-27T00:00:00.000Z",
    url: "https://store.steampowered.com/",
    appUrl: "steam://open/store",
  },
  {
    id: "steam-summer-sale-2026",
    platform: "Steam",
    title: "Steam Summer Sale 2026",
    startsAt: "2026-06-25T00:00:00.000Z",
    endsAt: "2026-07-10T00:00:00.000Z",
    url: "https://store.steampowered.com/",
    appUrl: "steam://open/store",
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/clusters/seasonalsales/bde830a37e773c5131fdd3c1/307d9145ec944876d3711818318fcc97bc7fd403/share_image_english.jpg?t=1782414429",
  },
  {
    id: "steam-autumn-sale-2026",
    platform: "Steam",
    title: "Steam Autumn Sale 2026",
    startsAt: "2026-10-01T00:00:00.000Z",
    endsAt: "2026-10-09T00:00:00.000Z",
    url: "https://store.steampowered.com/",
    appUrl: "steam://open/store",
  },
  {
    id: "steam-winter-sale-2026",
    platform: "Steam",
    title: "Steam Winter Sale 2026",
    startsAt: "2026-12-17T00:00:00.000Z",
    endsAt: "2027-01-05T00:00:00.000Z",
    url: "https://store.steampowered.com/",
    appUrl: "steam://open/store",
  },
];

const EPIC_2026_EVENTS = [
  {
    id: "epic-mega-sale-2026",
    platform: "Epic Games Store",
    title: "Epic Mega Sale 2026",
    startsAt: "2026-05-14T00:00:00.000Z",
    endsAt: "2026-06-11T00:00:00.000Z",
    url: "https://store.epicgames.com/",
    appUrl: "com.epicgames.launcher://store",
  },
  {
    id: "epic-black-friday-2026",
    platform: "Epic Games Store",
    title: "Epic Black Friday Sale 2026",
    startsAt: "2026-11-24T00:00:00.000Z",
    endsAt: "2026-12-01T00:00:00.000Z",
    url: "https://store.epicgames.com/",
    appUrl: "com.epicgames.launcher://store",
  },
  {
    id: "epic-holiday-sale-2026",
    platform: "Epic Games Store",
    title: "Epic Holiday Sale 2026",
    startsAt: "2026-12-17T00:00:00.000Z",
    endsAt: "2027-01-07T00:00:00.000Z",
    url: "https://store.epicgames.com/",
    appUrl: "com.epicgames.launcher://store",
  },
];

/**
 * Định dạng khoảng thời gian diễn ra sự kiện
 */
function formatDateRange(event) {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
  });

  return `${formatter.format(new Date(event.startsAt))} - ${formatter.format(new Date(event.endsAt))}`;
}

/**
 * Kiểm tra xem sự kiện có đang diễn ra tại thời điểm hiện tại không
 */
function isActiveEvent(event, now = new Date()) {
  return new Date(event.startsAt) <= now && now < new Date(event.endsAt);
}

/**
 * Map dữ liệu sự kiện thô sang cấu hình hiển thị của Bot
 */
function mapSaleEvent(event, saleGames = []) {
  let summary = "Sự kiện sale đang diễn ra.";
  if (saleGames.length > 0) {
    const discounts = saleGames.map(g => g.discountPercent).filter(d => typeof d === 'number' && d > 0);
    if (discounts.length > 0) {
      const maxDiscount = Math.max(...discounts);
      const minDiscount = Math.min(...discounts);
      const avgDiscount = Math.round(discounts.reduce((sum, val) => sum + val, 0) / discounts.length);
      
      summary = `🔥 Đợt siêu sale này quy tụ nhiều deal game giảm giá cực sâu từ **-${minDiscount}%** trở lên.\n` +
                `📊 Tỷ lệ giảm giá trung bình của các game đạt **-${avgDiscount}%**.\n` +
                `💥 Mức giảm giá kỷ lục trong đợt này lên tới **-${maxDiscount}%**!`;
    } else {
      summary = `🔥 Đợt siêu sale này quy tụ rất nhiều deal game chất lượng cao đang được chiết khấu sâu.`;
    }
  }

  return {
    id: `event:${event.id}`,
    title: event.title,
    alertType: "event",
    platform: event.platform,
    eventName: event.title,
    endDate: formatDateRange(event),
    url: event.url,
    appUrl: event.appUrl,
    image: event.image,
    discountPercent: saleGames[0]?.discountPercent,
    summary,
  };
}

/**
 * Lấy danh sách các sự kiện sale đang active của Steam và Epic Games Store
 */
function getActiveSaleEvents({ steamSales = [], epicSales = [], now = new Date() } = {}) {
  const activeSteamEvents = STEAM_2026_EVENTS.filter((event) => isActiveEvent(event, now)).map((event) =>
    mapSaleEvent(event, steamSales),
  );

  const activeEpicEvents = EPIC_2026_EVENTS.filter((event) => isActiveEvent(event, now)).map((event) =>
    mapSaleEvent(event, epicSales),
  );

  const events = [...activeSteamEvents, ...activeEpicEvents];

  // Nếu có Epic sales giảm sâu nhưng không có sự kiện Epic cụ thể nào diễn ra, 
  // chúng ta tạo một sự kiện chung "Epic Games Sales & Specials"
  if (epicSales.length > 0 && activeEpicEvents.length === 0) {
    const discounts = epicSales.map(g => g.discountPercent).filter(d => typeof d === 'number' && d > 0);
    let summary = "Nhiều deal Epic Games đang giảm giá sâu.";
    if (discounts.length > 0) {
      const maxDiscount = Math.max(...discounts);
      const minDiscount = Math.min(...discounts);
      const avgDiscount = Math.round(discounts.reduce((sum, val) => sum + val, 0) / discounts.length);
      summary = `🔥 Các deal Epic Games đang giảm giá sâu từ **-${minDiscount}%** trở lên.\n` +
                `📊 Tỷ lệ giảm giá trung bình đạt **-${avgDiscount}%**.\n` +
                `💥 Giảm giá sâu nhất lên tới **-${maxDiscount}%**!`;
    }

    events.push({
      id: "event:epic-sales-and-specials",
      title: "Epic Games Sales & Specials",
      alertType: "event",
      platform: "Epic Games Store",
      eventName: "Epic Games Sales & Specials",
      endDate: "Xem trên Epic Store",
      url: "https://store.epicgames.com/sales-and-specials",
      appUrl: "com.epicgames.launcher://store",
      discountPercent: epicSales[0]?.discountPercent,
      summary,
    });
  }

  return events;
}

module.exports = {
  STEAM_2026_EVENTS,
  EPIC_2026_EVENTS,
  getActiveSaleEvents,
  isActiveEvent,
  mapSaleEvent,
};
