/**
 * Configuration of a single game and its validation.
 * See specs/006-game-domain-model/spec.md SPEC-004 and design.md D-004, D-009.
 */
export interface GameConfig {
  readonly boardWidth: number;
  readonly boardHeight: number;
}

/** Upper bound for each board dimension (D-009). Internal — not part of the public API. */
export const MAX_BOARD_DIMENSION = 30;

function assertBoardDimension(name: keyof GameConfig, value: number): void {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_BOARD_DIMENSION) {
    throw new RangeError(
      `${name} must be an integer between 1 and ${MAX_BOARD_DIMENSION}, received ${String(value)}`,
    );
  }
}

/** Fail fast on an invalid configuration; never corrects values silently. */
export function validateGameConfig(config: GameConfig): void {
  assertBoardDimension('boardWidth', config.boardWidth);
  assertBoardDimension('boardHeight', config.boardHeight);
}
