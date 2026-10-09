export function formatDistance(meters: number | null | undefined) {
  if (meters == null || Number.isNaN(meters)) return "";
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

export function formatEventWhen(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
    .format(date)
    .replace("AM", "a.m.")
    .replace("PM", "p.m.");
  return `${day} · ${time}`;
}

export function formatEventPinDate(iso: string | null | undefined) {
  if (!iso) return "Soon";
  const date = new Date(iso);
  const today = new Date();
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  ) {
    return "Today";
  }
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

export function formatEventHeadline(startIso: string, endIso?: string | null) {
  const start = new Date(startIso);
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(start);
  const startTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(start);
  if (!endIso) return `${day} · ${startTime}`;
  const endTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(endIso));
  return `${day} · ${startTime} – ${endTime}`;
}

export function formatReviewDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function googleMapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function eventWindow(preset: DatePreset, customFrom?: string, customTo?: string) {
  const now = new Date();
  if (preset === "today") {
    return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
  }
  if (preset === "weekend") {
    const { start, end } = upcomingWeekend(now);
    return { from: start.toISOString(), to: end.toISOString() };
  }
  if (preset === "next_month") {
    const start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
    return { from: start.toISOString(), to: end.toISOString() };
  }
  if (preset === "custom" && customFrom && customTo) {
    return {
      from: new Date(`${customFrom}T00:00:00`).toISOString(),
      to: new Date(`${customTo}T23:59:59`).toISOString(),
    };
  }
  return {
    from: now.toISOString(),
    to: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export type DatePreset = "default" | "today" | "weekend" | "next_month" | "custom";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
}

function upcomingWeekend(now: Date) {
  const day = now.getDay();
  const saturdayOffset = day === 6 ? 0 : day === 0 ? -1 : 6 - day;
  const saturday = startOfDay(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + saturdayOffset),
  );
  const sunday = endOfDay(
    new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + 1),
  );
  return { start: saturday, end: sunday };
}
