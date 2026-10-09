const BROKEN_COVERS: Record<string, string> = {
  "photo-1506485338023-6ce45f88628b":
    "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80",
};

export function listingPhoto(
  cover: string | null | undefined,
  photos?: string[] | null,
) {
  const raw = cover || photos?.find(Boolean) || "";
  for (const [brokenId, replacement] of Object.entries(BROKEN_COVERS)) {
    if (raw.includes(brokenId)) return replacement;
  }
  return raw;
}
