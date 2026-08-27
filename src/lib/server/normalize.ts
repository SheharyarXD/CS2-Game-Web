import type { Skin as PrismaSkin, GameMap as PrismaMap } from "@prisma/client";
import type {
  CaseType,
  ColorKey,
  NormalizedMap,
  NormalizedSkin,
  RarityKey,
  WeaponCategory,
  WearKey,
} from "@/lib/game/types";

/** Maps a Prisma Skin row to the plain domain type the comparison engine consumes. */
export function toNormalizedSkin(skin: PrismaSkin): NormalizedSkin {
  return {
    id: skin.id,
    name: skin.name,
    weapon: skin.weapon,
    displayName: skin.displayName,
    imageUrl: skin.imageUrl,
    rarity: skin.rarity as RarityKey,
    caseOrCollection: skin.caseOrCollection,
    caseType: skin.caseType as CaseType,
    wear: skin.wear as WearKey,
    color: skin.color as ColorKey,
    weaponCategory: skin.weaponCategory as WeaponCategory,
    isKnife: skin.isKnife,
    isGlove: skin.isGlove,
  };
}

export function toNormalizedMap(map: PrismaMap): NormalizedMap {
  return {
    id: map.id,
    name: map.name,
    imageUrl: map.imageUrl,
    imageWidth: map.imageWidth,
    imageHeight: map.imageHeight,
  };
}

/**
 * Lightweight shape for search results / guess history. Includes the
 * guessed skin's own attributes (color/wear/case/rarity/knife) — safe to
 * expose because this always describes a skin the player already guessed,
 * never the secret target.
 */
export interface SkinSummary {
  id: string;
  displayName: string;
  weapon: string;
  name: string;
  imageUrl: string;
  rarity: RarityKey;
  wear: WearKey;
  caseOrCollection: string | null;
  caseType: CaseType;
  weaponCategory: WeaponCategory;
}

export function toSkinSummary(skin: PrismaSkin): SkinSummary {
  return {
    id: skin.id,
    displayName: skin.displayName,
    weapon: skin.weapon,
    name: skin.name,
    imageUrl: skin.imageUrl,
    rarity: skin.rarity as RarityKey,
    wear: skin.wear as WearKey,
    caseOrCollection: skin.caseOrCollection,
    caseType: skin.caseType as CaseType,
    weaponCategory: skin.weaponCategory as WeaponCategory,
  };
}
