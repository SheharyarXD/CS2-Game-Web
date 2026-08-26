"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MapOption {
  id: string;
  name: string;
}

export function MapSelector({
  onSelect,
  disabled,
  guessedIds,
}: {
  onSelect: (mapId: string) => void;
  disabled?: boolean;
  guessedIds: string[];
}) {
  const [maps, setMaps] = useState<MapOption[]>([]);

  useEffect(() => {
    fetch("/api/maps")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMaps);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
      {maps.map((map) => {
        const alreadyGuessed = guessedIds.includes(map.id);
        return (
          <button
            key={map.id}
            type="button"
            disabled={disabled || alreadyGuessed}
            onClick={() => onSelect(map.id)}
            className={cn(
              "focus-ring border px-2 py-2 font-display text-[12px] font-medium uppercase tracking-wide transition-colors",
              alreadyGuessed
                ? "cursor-not-allowed border-[#22333d] bg-[#101c23] text-[#4a5c68] line-through"
                : "border-[#3c5666] bg-gradient-to-b from-[#2c4150] to-[#1d3039] text-cs-text hover:border-cs-amber hover:text-white",
            )}
          >
            {map.name}
          </button>
        );
      })}
    </div>
  );
}
