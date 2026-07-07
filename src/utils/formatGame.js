function createGameId(game) {
  return [game.platform, game.title, game.url]
    .filter(Boolean)
    .join(":")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function normalizeGame(game) {
  return {
    ...game,
    id: game.id || createGameId(game),
    currentPrice: game.currentPrice || "Free",
  };
}

module.exports = {
  createGameId,
  normalizeGame,
};
