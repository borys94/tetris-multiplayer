import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  HIDDEN_ROWS,
  ghostPiece,
  pieceCells,
  shapeCells,
  type GameState,
  type PieceType,
} from "@tetris/game-core";

export const CELL_SIZE = 28;
export const BOARD_PIXEL_WIDTH = BOARD_WIDTH * CELL_SIZE;
export const BOARD_PIXEL_HEIGHT = BOARD_HEIGHT * CELL_SIZE;

export const PREVIEW_CELL_SIZE = 18;
export const PREVIEW_PIXEL_SIZE = 4 * PREVIEW_CELL_SIZE;

/** Własna paleta gry (nie kopiujemy kolorów znanych z innych gier). */
export const PIECE_COLORS: Readonly<Record<PieceType, string>> = {
  I: "#f472b6",
  O: "#a3e635",
  T: "#38bdf8",
  S: "#fbbf24",
  Z: "#a78bfa",
  J: "#2dd4bf",
  L: "#f87171",
};

const BOARD_BACKGROUND = "#111827";
const GRID_COLOR = "#1f2937";

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const px = x * size;
  const py = y * size;
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
  ctx.fillRect(px + 1, py + 1, size - 2, Math.max(2, size / 7));
}

function drawGhostCell(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  ctx.globalAlpha = 1;
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < BOARD_WIDTH; x++) {
    ctx.moveTo(x * CELL_SIZE + 0.5, 0);
    ctx.lineTo(x * CELL_SIZE + 0.5, BOARD_PIXEL_HEIGHT);
  }
  for (let y = 1; y < BOARD_HEIGHT; y++) {
    ctx.moveTo(0, y * CELL_SIZE + 0.5);
    ctx.lineTo(BOARD_PIXEL_WIDTH, y * CELL_SIZE + 0.5);
  }
  ctx.stroke();
}

/** Rysuje widoczną część planszy (bez ukrytych wierszy), ghost piece i aktywny klocek. */
export function drawBoard(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = BOARD_BACKGROUND;
  ctx.fillRect(0, 0, BOARD_PIXEL_WIDTH, BOARD_PIXEL_HEIGHT);
  drawGrid(ctx);

  state.board.forEach((row, y) => {
    if (y < HIDDEN_ROWS) return;
    row.forEach((cell, x) => {
      if (cell) drawCell(ctx, x, y - HIDDEN_ROWS, CELL_SIZE, PIECE_COLORS[cell]);
    });
  });

  const color = PIECE_COLORS[state.active.type];
  if (state.status === "playing") {
    for (const { x, y } of pieceCells(ghostPiece(state))) {
      if (y >= HIDDEN_ROWS) drawGhostCell(ctx, x, y - HIDDEN_ROWS, color);
    }
  }
  for (const { x, y } of pieceCells(state.active)) {
    if (y >= HIDDEN_ROWS) drawCell(ctx, x, y - HIDDEN_ROWS, CELL_SIZE, color);
  }
}

/** Rysuje klocek wyśrodkowany w małym polu podglądu (hold, next). */
export function drawPreview(ctx: CanvasRenderingContext2D, type: PieceType | null): void {
  ctx.clearRect(0, 0, PREVIEW_PIXEL_SIZE, PREVIEW_PIXEL_SIZE);
  if (!type) return;

  const cells = shapeCells(type);
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const width = Math.max(...xs) - Math.min(...xs) + 1;
  const height = Math.max(...ys) - Math.min(...ys) + 1;
  const offsetX = (4 - width) / 2 - Math.min(...xs);
  const offsetY = (4 - height) / 2 - Math.min(...ys);

  for (const { x, y } of cells) {
    drawCell(ctx, x + offsetX, y + offsetY, PREVIEW_CELL_SIZE, PIECE_COLORS[type]);
  }
}
