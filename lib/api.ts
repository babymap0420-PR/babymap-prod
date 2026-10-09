import type { Badge, MapLocation } from "@/types/location";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://ugvdxfdpxrwsqseodquo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

type SearchParams = {
  lat: number;
  lng: number;
  radiusM?: number;
  type?: string;
  categories?: string[];
  ageTags?: string[];
  freeOnly?: boolean;
  query?: string;
  eventFrom?: string;
  eventTo?: string;
};

function kidspotErrorMessage(raw: string, data: unknown, status: number) {
  const message =
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
      ? (data as { error: string }).error
      : raw.slice(0, 200) || `KidSpot API failed (${status})`;

  if (/schema cache/i.test(message) && /could not find the function public\./i.test(message)) {
    return "KidSpot database functions are missing on the hosted project. Apply the RPC and seed migrations, then retry.";
  }
  return message;
}

async function kidspot<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/kidspot`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const raw = await response.text();
  let data: T & { error?: string };
  try {
    data = (raw ? JSON.parse(raw) : {}) as T & { error?: string };
  } catch {
    throw new Error(`KidSpot API failed (${response.status})`);
  }
  if (!response.ok || (data && typeof data === "object" && "error" in data && data.error)) {
    throw new Error(kidspotErrorMessage(raw, data, response.status));
  }
  return data;
}

export function hasSupabaseKey() {
  return Boolean(SUPABASE_PUBLISHABLE_KEY);
}

export async function searchLocations(params: SearchParams) {
  const data = await kidspot<{ locations: MapLocation[] }>("search", {
    lat: params.lat,
    lng: params.lng,
    radius_m: params.radiusM ?? 8000,
    type: params.type ?? "all",
    categories: params.categories ?? [],
    age_tags: params.ageTags ?? [],
    free_only: params.freeOnly ?? false,
    query: params.query ?? "",
    event_from: params.eventFrom ?? null,
    event_to: params.eventTo ?? null,
  });
  return data.locations ?? [];
}

export async function getLocation(
  id: string,
  userId: string | null,
  point: { lat: number; lng: number },
) {
  const data = await kidspot<{ location: MapLocation }>("get", {
    id,
    user_id: userId,
    lat: point.lat,
    lng: point.lng,
  });
  return data.location;
}

export async function addReview(payload: {
  userId: string;
  locationId: string;
  body: string;
  photoUrl?: string;
  thumbsUp: boolean;
  displayName?: string;
}) {
  return kidspot<{ id: string; status: string; badges: Badge[] }>("review", {
    user_id: payload.userId,
    location_id: payload.locationId,
    body: payload.body,
    photo_url: payload.photoUrl ?? null,
    thumbs_up: payload.thumbsUp,
    display_name: payload.displayName ?? null,
  });
}

export async function toggleFavourite(payload: {
  userId: string;
  locationId: string;
  displayName?: string;
}) {
  return kidspot<{ is_favourite: boolean; favourite_count: number }>(
    "favourite",
    {
      user_id: payload.userId,
      location_id: payload.locationId,
      display_name: payload.displayName ?? null,
    },
  );
}

export async function upvoteLocation(payload: {
  userId: string;
  locationId: string;
  displayName?: string;
}) {
  return kidspot<{ upvote_count: number }>("upvote", {
    user_id: payload.userId,
    location_id: payload.locationId,
    display_name: payload.displayName ?? null,
  });
}

export async function submitLocation(payload: Record<string, unknown>) {
  return kidspot<{ id: string; status: string; badges: Badge[] }>(
    "submit",
    payload,
  );
}

export async function flagContent(payload: {
  userId: string;
  contentType: "location" | "review";
  contentId: string;
  reason?: string;
}) {
  return kidspot<{ classification: string; resolution: string }>("flag", {
    user_id: payload.userId,
    content_type: payload.contentType,
    content_id: payload.contentId,
    reason: payload.reason ?? null,
  });
}

export async function getProfile(userId: string, displayName?: string) {
  return kidspot<{
    user: { id: string; display_name: string | null };
    badges: Badge[];
    all_badges: Badge[];
  }>("profile", {
    user_id: userId,
    display_name: displayName ?? null,
  });
}
