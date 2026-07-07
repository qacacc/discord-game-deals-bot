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

function formatDateRange(event) {
  const formatter = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
  });

  return `${formatter.format(new Date(event.startsAt))} - ${formatter.format(new Date(event.endsAt))}`;
}

function isActiveEvent(event, now = new Date()) {
  return new Date(event.startsAt) <= now && now < new Date(event.endsAt);
}

function mapSaleEvent(event, saleGames = []) {
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
    summary: saleGames.length
      ? `Đang có ${saleGames.length} deal nổi bật trong danh sách bot lọc.`
      : "Sự kiện sale đang diễn ra.",
  };
}

function getActiveSaleEvents({ steamSales = [], epicSales = [], now = new Date() } = {}) {
  const events = STEAM_2026_EVENTS.filter((event) => isActiveEvent(event, now)).map((event) =>
    mapSaleEvent(event, steamSales),
  );

  if (epicSales.length > 0) {
    events.push({
      id: "event:epic-sales-and-specials",
      title: "Epic Games Sales & Specials",
      alertType: "event",
      platform: "Epic Games Store",
      eventName: "Epic Games Sales & Specials",
      endDate: "Xem trên Epic",
      url: "https://store.epicgames.com/sales-and-specials",
      appUrl: "com.epicgames.launcher://store",
      discountPercent: epicSales[0]?.discountPercent,
      summary: `Đang có ${epicSales.length} deal Epic nổi bật trong danh sách bot lọc.`,
    });
  }

  return events;
}

module.exports = {
  STEAM_2026_EVENTS,
  getActiveSaleEvents,
  isActiveEvent,
  mapSaleEvent,
};
