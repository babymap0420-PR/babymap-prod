import type { LocationKind, TypeTab } from "@/types/location";

export const PLACE_CATEGORIES = [
  { id: "indoor_play", label: "Indoor Play", emoji: "🧸", color: "#8B5CF6" },
  { id: "playgrounds", label: "Playgrounds", emoji: "🛝", color: "#3B82F6" },
  { id: "libraries", label: "Libraries", emoji: "📚", color: "#0EA5E9" },
  { id: "dining", label: "Dining", emoji: "🍽️", color: "#E07A3D" },
  { id: "attractions", label: "Attractions", emoji: "🎡", color: "#A855F7" },
  { id: "community_centre", label: "Community Centre", emoji: "🏛️", color: "#3B82F6" },
  { id: "farms_nature", label: "Farms & Nature", emoji: "🌳", color: "#3D9A4A" },
] as const;

export const EVENT_CATEGORIES = [
  { id: "workshop", label: "Workshop", emoji: "🎨", color: "#FF6B6B" },
  { id: "class", label: "Class", emoji: "🎵", color: "#EC4899" },
  { id: "seasonal", label: "Seasonal", emoji: "🍂", color: "#D97706" },
  { id: "festivals", label: "Festivals", emoji: "🎪", color: "#F59E0B" },
  { id: "markets", label: "Markets", emoji: "🛍️", color: "#14B8A6" },
  { id: "performances", label: "Performances", emoji: "🎭", color: "#8B5CF6" },
] as const;

export const AGE_TAGS = [
  { id: "baby_0_1", label: "Baby 0–1", emoji: "👶" },
  { id: "toddler_1_3", label: "Toddler 1–3", emoji: "🐣" },
  { id: "pre_k_3_5", label: "Pre-K 3–5", emoji: "🎒" },
  { id: "kids_5_plus", label: "Kids 5+", emoji: "⚽" },
] as const;

export const AMENITY_LABELS: Record<string, string> = {
  washroom: "Washroom",
  washroom_on_site: "Washroom",
  parking: "Parking",
  stroller_friendly: "Stroller-friendly",
  "stroller-friendly": "Stroller-friendly",
  fenced: "Fenced",
  fenced_area: "Fenced",
  shade: "Shade",
  shaded_seating: "Shaded seating",
  benches: "Benches",
  water_fountain: "Water fountain",
};

const LEGACY_CATEGORY: Record<string, string> = {
  park: "farms_nature",
  splash_pad: "playgrounds",
  playground: "playgrounds",
  story_time: "class",
};

const ALL_CATEGORIES = [...PLACE_CATEGORIES, ...EVENT_CATEGORIES];

function resolveCategory(id: string) {
  return LEGACY_CATEGORY[id] ?? id;
}

export function categoryLabel(id: string) {
  const resolved = resolveCategory(id);
  return ALL_CATEGORIES.find((item) => item.id === resolved)?.label ?? resolved;
}

export function categoryEmoji(id: string) {
  const resolved = resolveCategory(id);
  return ALL_CATEGORIES.find((item) => item.id === resolved)?.emoji ?? "📍";
}

export function categoryColor(id: string) {
  const resolved = resolveCategory(id);
  return ALL_CATEGORIES.find((item) => item.id === resolved)?.color ?? "#FF6B6B";
}

export function ageLabel(id: string) {
  return AGE_TAGS.find((item) => item.id === id)?.label ?? id;
}

export function categoriesForTab(tab: TypeTab) {
  if (tab === "place") return [...PLACE_CATEGORIES];
  if (tab === "event") return [...EVENT_CATEGORIES];
  return [];
}

export function pinKind(type: LocationKind) {
  return type === "place" ? "place" : "event";
}
