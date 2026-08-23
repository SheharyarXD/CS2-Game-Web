"use client";

import { motion } from "framer-motion";
import { zoomScaleForRevealPercent } from "@/lib/game/mapGame";

interface MapRevealProps {
  imageUrl: string;
  revealPercent: number;
  focalX: number;
  focalY: number;
}

export function MapReveal({ imageUrl, revealPercent, focalX, focalY }: MapRevealProps) {
  const scale = zoomScaleForRevealPercent(revealPercent);

  return (
    <div className="tactical-panel relative aspect-square w-full overflow-hidden border-2 border-base-700">
      <motion.img
        src={imageUrl}
        alt="Zoomed-in section of the target map, identify it before you run out of guesses"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transformOrigin: `${focalX}% ${focalY}%` }}
        animate={{ scale }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute right-2 top-2 rounded-sm bg-base-950/80 px-2 py-1 font-display text-xs font-semibold uppercase tracking-wider text-accent-orange">
        {Math.round(revealPercent)}% revealed
      </div>
    </div>
  );
}
