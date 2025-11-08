import { presetMaps } from "./MinesweeperSettingsConstants";

export function getInitialState(initial = {}) {
  const preset = initial.preset ?? "Medium";
  const rows = initial.rows ?? presetMaps[preset]?.rows;
  const cols = initial.cols ?? presetMaps[preset]?.cols;
  const mines = initial.mines ?? presetMaps[preset]?.mines;
  const lives = initial.lives ?? 3;
  const showTimer = true;
  const captureReplay = true;
  const allowUndo = true;
  const enableHints = false;
  const holdHighlight = true;
  const quickFlag = initial.quickFlagEnabled ?? false;
  return { preset, rows, cols, mines, lives, showTimer, captureReplay, allowUndo, enableHints, holdHighlight, quickFlag };
}
