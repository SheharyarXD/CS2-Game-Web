// Shape of one entry in the ByMykel/CSGO-API `skins.json` dataset.
// Only the fields we actually consume are typed — the real payload has a
// few more (description, min_float, max_float, paint_index, team, ...).
export interface RawSkin {
  id: string;
  name: string;
  weapon: { id: string; weapon_id: number; name: string } | null;
  category: { id: string; name: string } | null;
  pattern: { id: string; name: string } | null;
  rarity: { id: string; name: string; color: string };
  stattrak: boolean;
  souvenir: boolean;
  wears: Array<{ id: string; name: string }>;
  collections: Array<{ id: string; name: string; image: string }>;
  crates: Array<{ id: string; name: string; image: string }>;
  image: string;
}
