const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function parseHour(value: string) {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h)) return null;
  return h * 60 + (Number.isFinite(m) ? m : 0);
}

export function openClosedLabel(hours: Record<string, string> | null | undefined) {
  if (!hours) return null;
  const key = DAYS[new Date().getDay()];
  const slot = hours[key];
  if (!slot || slot.toLowerCase() === "closed") return "Closed";

  const [startRaw, endRaw] = slot.split("-").map((part) => part.trim());
  const start = parseHour(normalizeHour(startRaw));
  const end = parseHour(normalizeHour(endRaw));
  if (start == null || end == null) return null;

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return minutes >= start && minutes <= end ? "Open" : "Closed";
}

function normalizeHour(value: string) {
  if (!value) return "";
  if (value.includes(":")) return value;
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return `${String(n).padStart(2, "0")}:00`;
}

export function hoursSummary(hours: Record<string, string> | null | undefined) {
  if (!hours) return "Hours not listed";
  const key = DAYS[new Date().getDay()];
  const slot = hours[key];
  if (!slot) return "Hours not listed";
  if (slot.toLowerCase() === "closed") return "Closed today";
  return `Today ${slot.replace("-", " – ")}`;
}
