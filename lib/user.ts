const USER_KEY = "kidspot_user_id";
const NAME_KEY = "kidspot_display_name";
const VOTES_KEY = "kidspot_upvoted_ids";
const SESSION_KEY = "kidspot_session";
const ACCOUNTS_KEY = "kidspot_accounts";

const RESERVED_USERNAMES = [
  "sarah_m",
  "michael_t",
  "priya_k",
  "admin",
  "kidspot",
  "parent",
  "user",
];

export type KidSpotAccount = {
  id: string;
  username: string;
  name: string;
  email: string;
  nickname?: string;
  phone?: string;
  neighbourhood?: string;
  numKids: number;
};

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

export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KidSpotAccount;
    if (!parsed?.id || !parsed.email || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isUsernameTaken(username: string) {
  const key = username.trim().toLowerCase();
  if (!key) return false;
  if (RESERVED_USERNAMES.includes(key)) return true;
  return readAccounts().some((account) => account.username.toLowerCase() === key);
}

export function findAccountByEmail(email: string) {
  const key = email.trim().toLowerCase();
  return readAccounts().find((account) => account.email.toLowerCase() === key) ?? null;
}

export function rememberAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const meta = user.user_metadata ?? {};
  const text = (key: string) => (typeof meta[key] === "string" ? meta[key].trim() : "");
  const name =
    text("display_name") ||
    text("full_name") ||
    text("name") ||
    user.email?.split("@")[0] ||
    "Parent";
  const account: KidSpotAccount = {
    id: user.id,
    username: text("username") || name,
    name: text("full_name") || name,
    email: user.email ?? "",
    nickname: text("display_name") || undefined,
    phone: text("phone") || undefined,
    neighbourhood: text("neighbourhood") || undefined,
    numKids: Number(meta.num_kids ?? 0) || 0,
  };
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(
    readAccounts().filter((item) => item.email.toLowerCase() !== account.email.toLowerCase()).concat(account),
  ));
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(account));
  window.localStorage.setItem(USER_KEY, account.id);
  setDisplayName(account.nickname || account.name);
  return account;
}

export function clearAuthSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(NAME_KEY);
}

export function signInAccount(account: KidSpotAccount) {
  const accounts = readAccounts().filter(
    (item) => item.email.toLowerCase() !== account.email.toLowerCase(),
  );
  accounts.push(account);
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(account));
  window.localStorage.setItem(USER_KEY, account.id);
  setDisplayName(account.nickname?.trim() || account.name);
}

function readAccounts() {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is KidSpotAccount =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as KidSpotAccount).id === "string" &&
        typeof (item as KidSpotAccount).email === "string",
    );
  } catch {
    return [];
  }
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
