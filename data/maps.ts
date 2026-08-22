/**
 * Map pool configuration.
 *
 * To add a new Valve map to rotation: add an entry here, run
 * `npm run generate:map-art -- <id>` (or drop a real overview image at
 * public/maps/<id>.jpg yourself), then `npm run seed:maps`. No game-logic
 * code needs to change — see src/lib/game/mapGame.ts, which is generic
 * over any map's dimensions/focal point.
 *
 * `focalX`/`focalY` (0-100) is the point the zoomed-in reveal starts
 * centered on; pick a visually distinctive area of the map.
 */
export interface MapConfigEntry {
  id: string;
  name: string;
  focalX?: number;
  focalY?: number;
}

export const MAP_POOL: MapConfigEntry[] = [
  { id: "agency", name: "Agency" },
  { id: "office", name: "Office" },
  { id: "train", name: "Train" },
  { id: "ancient", name: "Ancient" },
  { id: "anubis", name: "Anubis" },
  { id: "cache", name: "Cache" },
  { id: "dust2", name: "Dust II" },
  { id: "mirage", name: "Mirage" },
  { id: "overpass", name: "Overpass" },
  { id: "inferno", name: "Inferno" },
  { id: "nuke", name: "Nuke" },
  { id: "vertigo", name: "Vertigo" },
];
