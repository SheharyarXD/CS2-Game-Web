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
    <div className="relative aspect-[4/3] w-full overflow-hidden border border-[#3c5666] bg-[#0e1922]">
      <motion.img
        src={imageUrl}
        alt="Zoomed-in section of the target map, identify it before you run out of guesses"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transformOrigin: `${focalX}% ${focalY}%` }}
        animate={{ scale }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute right-1.5 top-1.5 border border-[#3c5666] bg-black/70 px-1.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-wider text-cs-amberLt">
        {Math.round(revealPercent)}% revealed
      </div>
    </div>
  );
}
