"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { SkinSummary } from "@/lib/server/normalize";
import { RARITY_LABELS } from "@/lib/game/config";
import { cn } from "@/lib/utils";

interface SkinSearchProps {
  onSelect: (skin: SkinSummary) => void;
  disabled?: boolean;
  excludeIds?: string[];
}

export function SkinSearch({ onSelect, disabled, excludeIds = [] }: SkinSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SkinSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 200);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedQuery.trim().length === 0) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/skins/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: SkinSummary[]) => {
        if (!cancelled) {
          setResults(data.filter((s) => !excludeIds.includes(s.id)));
          setActiveIndex(-1);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(skin: SkinSummary) {
    onSelect(skin);
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = results[activeIndex] ?? results[0];
      if (chosen) select(chosen);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label htmlFor="skin-search" className="sr-only">
        Search for a skin
      </label>
      <input
        id="skin-search"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls="skin-search-listbox"
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        placeholder="Search by weapon or skin name..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="focus-ring w-full border border-[#3c5666] bg-[#0e1922] px-3 py-2 text-[12.5px] text-white placeholder:text-cs-dim2 disabled:opacity-50"
      />

      {open && (loading || results.length > 0) && (
        <ul
          id="skin-search-listbox"
          role="listbox"
          className="scrollbar-thin absolute z-30 mt-0.5 max-h-80 w-full overflow-y-auto border border-[#3c5666] bg-[#101c23] shadow-lg shadow-black/50"
        >
          {loading && results.length === 0 && (
            <li className="px-3 py-2.5 text-[12px] text-cs-dim2">Searching...</li>
          )}
          {results.map((skin, index) => (
            <li key={skin.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onClick={() => select(skin)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors",
                  index === activeIndex ? "bg-[#2a4152]" : "hover:bg-[#1d3039]",
                )}
              >
                <span className="relative h-9 w-12 shrink-0 overflow-hidden border border-[#2c4150] bg-[#0a1218]">
                  <Image
                    src={skin.imageUrl}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-contain"
                    unoptimized
                    loading="eager"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-white">
                    {skin.weapon} | {skin.name}
                  </span>
                  <span className="block text-[10px] text-cs-dim2">{RARITY_LABELS[skin.rarity]}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
