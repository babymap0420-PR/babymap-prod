const USER_KEY = "kidspot_user_id";
const NAME_KEY = "kidspot_display_name";
const VOTES_KEY = "kidspot_upvoted_ids";

export function getAppUserId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(USER_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(USER_KEY, id);
  return id;
}

export function getDisplayName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function setDisplayName(name: string) {
  window.localStorage.setItem(NAME_KEY, name.trim());
}

export function hasUpvoted(id: string) {
  return readVotes().includes(id);
}

export function markUpvoted(id: string) {
  const next = Array.from(new Set([...readVotes(), id]));
  window.localStorage.setItem(VOTES_KEY, JSON.stringify(next));
}

function readVotes() {
  try {
    const raw = window.localStorage.getItem(VOTES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
