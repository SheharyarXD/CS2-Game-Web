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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {maps.map((map) => {
        const alreadyGuessed = guessedIds.includes(map.id);
        return (
          <button
            key={map.id}
            type="button"
            disabled={disabled || alreadyGuessed}
            onClick={() => onSelect(map.id)}
            className={cn(
              "focus-ring border px-3 py-3 font-display text-sm font-medium uppercase tracking-wide transition-colors",
              alreadyGuessed
                ? "cursor-not-allowed border-base-800 bg-base-900 text-neutral-600"
                : "border-base-600 bg-base-800 text-neutral-100 hover:border-accent-orange hover:bg-base-700",
            )}
          >
            {map.name}
          </button>
        );
      })}
    </div>
  );
}
