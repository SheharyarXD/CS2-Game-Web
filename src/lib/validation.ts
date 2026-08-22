import { z } from "zod";

export const skinGuessSchema = z.object({
  skinId: z.string().min(1),
});

export const mapGuessSchema = z.object({
  mapId: z.string().min(1),
});

export const clueSchema = z.object({
  clue: z.enum(["case", "rarity", "color"]),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
});
