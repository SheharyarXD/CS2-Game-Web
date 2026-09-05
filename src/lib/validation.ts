import { z } from "zod";

export const skinGuessSchema = z.object({
  skinId: z.string().min(1),
});

export const mapGuessSchema = z.object({
  mapId: z.string().min(1),
});

export const clueSchema = z.object({
  clue: z.enum(["collection", "rarity", "color"]),
});

export const agentSchema = z.object({
  agentId: z.string().min(1),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(80),
});
