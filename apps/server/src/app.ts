import { BOARD_HEIGHT, BOARD_WIDTH } from "@tetris/game-core";
import express, { type Express } from "express";

export function createApp(): Express {
  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", board: { width: BOARD_WIDTH, height: BOARD_HEIGHT } });
  });

  return app;
}
