export type EventCategory =
  | "playdate"
  | "class"
  | "meetup"
  | "market"
  | "outdoors";

export type Host = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  followers: number;
  bio: string;
};

export type Review = {
  id: string;
  author: string;
  avatarUrl: string;
  rating: number;
  dateLabel: string;
  text: string;
};

export type Attendee = {
  id: string;
  name: string;
  avatarUrl: string;
};

export type BabyEvent = {
  id: string;
  title: string;
  category: EventCategory;
  ageRange: string;
  rating: number;
  reviewCount: number;
  goingCount: number;
  startsAt: string;
  endsAt: string;
  address: string;
  neighborhood: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  photos: string[];
  host: Host;
  price: string;
  tags: string[];
  reviews: Review[];
  attendees: Attendee[];
  phone?: string;
  websiteLabel?: string;
};

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  playdate: "Playdate",
  class: "Class",
  meetup: "Meetup",
  market: "Market",
  outdoors: "Outdoors",
};

export const CATEGORY_EMOJI: Record<EventCategory, string> = {
  playdate: "🧸",
  class: "🎵",
  meetup: "☕",
  market: "🧺",
  outdoors: "🌳",
};
