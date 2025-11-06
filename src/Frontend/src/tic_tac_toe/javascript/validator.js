// Fast local validation (no server roundtrip)

export function inBounds(game, r, c) {
  return r >= 0 && c >= 0 && r < game.size && c < game.size;
}

export function isCellEmpty(game, r, c) {
  return game.board?.[r]?.[c] === '.';
}

export function isRunning(game) {
  return game?.status === 'running';
}

export function canPlayLocally(game, r, c) {
  return Boolean(game && isRunning(game) && inBounds(game, r, c) && isCellEmpty(game, r, c));
}
