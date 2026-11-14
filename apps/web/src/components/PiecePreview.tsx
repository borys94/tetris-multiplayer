import type { PieceType } from "@tetris/game-core";
import { useEffect, useRef } from "react";
import { PREVIEW_PIXEL_SIZE, drawPreview } from "../game/render";

interface PiecePreviewProps {
  type: PieceType | null;
  label: string;
}

export function PiecePreview({ type, label }: PiecePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawPreview(ctx, type);
  }, [type]);

  return (
    <canvas
      ref={canvasRef}
      width={PREVIEW_PIXEL_SIZE}
      height={PREVIEW_PIXEL_SIZE}
      role="img"
      aria-label={type ? `${label}: ${type}` : `${label}: pusto`}
    />
  );
}
