// Shapes of the ByMykel/CSGO-API datasets we consume. Only the fields we
// actually read are typed — the real payloads carry a few more
// (description, min_float, max_float, paint_index, team, ...).

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

/**
 * One container from crates.json. `first_sale_date` is the day the crate
 * went on sale and is the authority for a skin's original release; it is
 * absent on some container types we never use (souvenir packages,
 * autograph capsules), which is why it is optional here.
 */
export interface RawCrate {
  id: string;
  name: string;
  /** "Case" | "Souvenir" | "Sticker Capsule" | ... */
  type: string | null;
  first_sale_date: string | null;
}

/**
 * One collection from collections.json. All but one carry a release_date,
 * and `crates` says which containers ship it — that link is what lets an
 * undated crate inherit its collection's date.
 */
export interface RawCollection {
  id: string;
  name: string;
  release_date: string | null;
  crates?: Array<{ id: string; name: string }>;
}
