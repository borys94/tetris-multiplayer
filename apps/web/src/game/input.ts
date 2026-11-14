import type { Action } from "@tetris/game-core";

/** Opóźnienie przed auto-powtarzaniem ruchu w bok (Delayed Auto Shift), w tickach. */
export const DAS_TICKS = 10;
/** Odstęp między powtórzeniami ruchu w bok (Auto Repeat Rate), w tickach. */
export const ARR_TICKS = 2;
/** Odstęp między powtórzeniami soft dropu przy trzymanym klawiszu, w tickach. */
export const SOFT_DROP_TICKS = 2;

const KEY_BINDINGS: Readonly<Record<string, Action>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "softDrop",
  Space: "hardDrop",
  ArrowUp: "rotateCw",
  KeyX: "rotateCw",
  KeyZ: "rotateCcw",
  KeyC: "hold",
};

type Direction = "left" | "right";

export function isGameKey(code: string): boolean {
  return code in KEY_BINDINGS;
}

/**
 * Zamienia naciśnięcia klawiszy na akcje silnika. `update()` wywołujemy raz na tick;
 * DAS/ARR liczymy w tickach, więc zachowanie nie zależy od FPS ani od autorepeat systemu.
 */
export class InputController {
  private pending: Action[] = [];
  private directions: Direction[] = [];
  private shiftTicks = 0;
  private softDropHeld = false;
  private softDropTicks = 0;

  keyDown(code: string): void {
    const action = KEY_BINDINGS[code];
    if (!action) return;

    if (action === "left" || action === "right") {
      this.directions = [...this.directions.filter((d) => d !== action), action];
      this.shiftTicks = 0;
    } else if (action === "softDrop") {
      this.softDropHeld = true;
      this.softDropTicks = 0;
    }
    this.pending.push(action);
  }

  keyUp(code: string): void {
    const action = KEY_BINDINGS[code];
    if (action === "left" || action === "right") {
      this.directions = this.directions.filter((d) => d !== action);
      this.shiftTicks = 0;
    } else if (action === "softDrop") {
      this.softDropHeld = false;
    }
  }

  update(): Action[] {
    const actions = this.pending;
    this.pending = [];

    const direction = this.directions.at(-1);
    if (direction) {
      this.shiftTicks++;
      if (this.shiftTicks >= DAS_TICKS && (this.shiftTicks - DAS_TICKS) % ARR_TICKS === 0) {
        actions.push(direction);
      }
    }

    if (this.softDropHeld) {
      this.softDropTicks++;
      if (this.softDropTicks % SOFT_DROP_TICKS === 0) actions.push("softDrop");
    }

    return actions;
  }

  reset(): void {
    this.pending = [];
    this.directions = [];
    this.shiftTicks = 0;
    this.softDropHeld = false;
    this.softDropTicks = 0;
  }
}
