const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "sent.json");

function createEmptyStore() {
  return { sent: [] };
}

function normalizeStore(data) {
  if (!data || !Array.isArray(data.sent)) {
    return createEmptyStore();
  }

  return {
    sent: [...new Set(data.sent.filter(Boolean))],
  };
}

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

function saveSentGames(data) {
  const normalized = normalizeStore(data);
  fs.writeFileSync(filePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

function isGameSent(gameId, data) {
  return normalizeStore(data).sent.includes(gameId);
}

function markGameAsSent(gameId, data) {
  if (!gameId) {
    return;
  }

  if (!Array.isArray(data.sent)) {
    data.sent = [];
  }

  if (!data.sent.includes(gameId)) {
    data.sent.push(gameId);
  }
}

module.exports = {
  loadSentGames,
  saveSentGames,
  isGameSent,
  markGameAsSent,
};
