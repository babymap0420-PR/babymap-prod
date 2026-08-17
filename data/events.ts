import type { AreaLabel, GeoPoint } from "@/lib/geo";
import { FALLBACK_AREA } from "@/lib/geo";
import type { BabyEvent, EventCategory, Host } from "@/types/event";

const hosts = {
  maya: {
    id: "host-maya",
    name: "Maya Chen",
    handle: "@mayaandbean",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    followers: 1280,
    bio: "Mom of Bean (10 mo). Sharing gentle playdates around the park.",
  },
  jordan: {
    id: "host-jordan",
    name: "Jordan Hale",
    handle: "@strollerclub",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
    followers: 3420,
    bio: "Weekend stroller walks, coffee, and new-parent hangouts.",
  },
  priya: {
    id: "host-priya",
    name: "Priya Nair",
    handle: "@littlenotes",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
    followers: 890,
    bio: "Music teacher and mom of two. Classes for wiggly listeners.",
  },
  sam: {
    id: "host-sam",
    name: "Sam Ortiz",
    handle: "@gearsharebay",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    followers: 2104,
    bio: "Organizing swaps so families can pass along what still has life in it.",
  },
  lena: {
    id: "host-lena",
    name: "Lena Brooks",
    handle: "@tummytimepicnic",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
    followers: 1560,
    bio: "Outdoor play, blankets, and snacks. All caregivers welcome.",
  },
} satisfies Record<string, Host>;

const EVENT_LAYOUT: Record<string, { lat: number; lng: number; placeName: string }> = {
  "sensory-play-ggp": { lat: 0.012, lng: 0.008, placeName: "Neighborhood playground" },
  "parents-coffee": { lat: 0.004, lng: -0.01, placeName: "Local coffee shop" },
  "stroller-walk": { lat: -0.008, lng: 0.012, placeName: "Riverside path" },
  "baby-music": { lat: -0.011, lng: -0.006, placeName: "Community studio" },
  "storytime-library": { lat: 0.007, lng: 0.003, placeName: "Public library" },
  "family-market": { lat: 0.014, lng: -0.004, placeName: "Weekend market" },
  "gear-swap": { lat: -0.006, lng: -0.013, placeName: "Arts plaza" },
  "tummy-time-picnic": { lat: 0.002, lng: 0.011, placeName: "Neighborhood park" },
  "sunset-support": { lat: -0.013, lng: 0.005, placeName: "Main street corner" },
};

export const EVENTS: BabyEvent[] = [
  {
    id: "sensory-play-ggp",
    title: "Sensory Play Morning",
    category: "playdate",
    ageRange: "Ages 0–18 mo",
    rating: 4.8,
    reviewCount: 126,
    goingCount: 18,
    startsAt: "2026-08-16T10:00:00",
    endsAt: "2026-08-16T11:30:00",
    address: "Koret Children's Quarter, Golden Gate Park",
    neighborhood: "Golden Gate Park",
    city: "San Francisco, CA",
    latitude: 37.7689,
    longitude: -122.482,
    description:
      "Bring a blanket and a curious little one. We'll set out water beads, fabric bins, and musical toys under the trees. Caregivers chat while babies explore at their own pace.",
    photos: [
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1200&q=80",
    ],
    host: hosts.maya,
    price: "Free",
    tags: ["Sensory", "Park", "Drop-in"],
    phone: "(415) 555-0142",
    websiteLabel: "mayaandbean.com",
    attendees: [
      {
        id: "a1",
        name: "Nina",
        avatarUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80",
      },
      {
        id: "a2",
        name: "Chris",
        avatarUrl:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80",
      },
      {
        id: "a3",
        name: "Ava",
        avatarUrl:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=80&q=80",
      },
    ],
    reviews: [
      {
        id: "r1",
        author: "Nina Park",
        avatarUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80",
        rating: 5,
        dateLabel: "2 days ago",
        text: "Bean's mom runs this so calmly. Plenty of shade, and nobody minded if my baby just watched.",
      },
      {
        id: "r2",
        author: "Chris Alvarez",
        avatarUrl:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80",
        rating: 5,
        dateLabel: "1 week ago",
        text: "Easy to find, friendly faces, and we left with two new park buddies.",
      },
    ],
  },
  {
    id: "parents-coffee",
    title: "New Parents Coffee Circle",
    category: "meetup",
    ageRange: "Newborn–12 mo",
    rating: 4.6,
    reviewCount: 89,
    goingCount: 12,
    startsAt: "2026-08-17T09:00:00",
    endsAt: "2026-08-17T10:30:00",
    address: "Sightglass Coffee, 270 7th St",
    neighborhood: "SoMa",
    city: "San Francisco, CA",
    latitude: 37.777,
    longitude: -122.4086,
    description:
      "A no-agenda coffee hour for anyone running on naps and caffeine. High chairs near the window, stroller parking by the door, and a rotating prompt if you want it.",
    photos: [
      "https://images.unsplash.com/photo-1442512595331-e89e7384470d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    ],
    host: hosts.jordan,
    price: "Free",
    tags: ["Coffee", "New parents"],
    attendees: [
      {
        id: "a4",
        name: "Lee",
        avatarUrl:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=80&q=80",
      },
      {
        id: "a5",
        name: "Mina",
        avatarUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80",
      },
    ],
    reviews: [
      {
        id: "r3",
        author: "Lee Kim",
        avatarUrl:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=80&q=80",
        rating: 4,
        dateLabel: "3 days ago",
        text: "Loud in a good way. Staff were kind about the stroller traffic.",
      },
    ],
  },
  {
    id: "stroller-walk",
    title: "Stroller Walk Club",
    category: "outdoors",
    ageRange: "All ages",
    rating: 4.9,
    reviewCount: 204,
    goingCount: 26,
    startsAt: "2026-08-16T08:30:00",
    endsAt: "2026-08-16T09:45:00",
    address: "Crissy Field East Beach",
    neighborhood: "Marina",
    city: "San Francisco, CA",
    latitude: 37.8037,
    longitude: -122.464,
    description:
      "An easy coastal loop with room to walk side-by-side. We meet by the grass, walk toward the bridge, and end with a snack on the sand if the wind behaves.",
    photos: [
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80",
    ],
    host: hosts.jordan,
    price: "Free",
    tags: ["Walk", "Bay views"],
    attendees: [
      {
        id: "a6",
        name: "Omar",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
      },
      {
        id: "a7",
        name: "Tess",
        avatarUrl:
          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=80&q=80",
      },
      {
        id: "a8",
        name: "Noor",
        avatarUrl:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&q=80",
      },
    ],
    reviews: [
      {
        id: "r4",
        author: "Tess Morgan",
        avatarUrl:
          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=80&q=80",
        rating: 5,
        dateLabel: "Yesterday",
        text: "The best Saturday reset. Jordan keeps the pace slow enough for napping babies.",
      },
    ],
  },
  {
    id: "baby-music",
    title: "Baby Music Together",
    category: "class",
    ageRange: "Ages 4–24 mo",
    rating: 4.7,
    reviewCount: 67,
    goingCount: 9,
    startsAt: "2026-08-18T10:30:00",
    endsAt: "2026-08-18T11:15:00",
    address: "Mission Cultural Center, 2868 Mission St",
    neighborhood: "Mission",
    city: "San Francisco, CA",
    latitude: 37.7516,
    longitude: -122.4186,
    description:
      "Songs, shakers, and laps-around-the-room dancing. Priya keeps it short, warm, and okay if someone cries through the chorus.",
    photos: [
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1200&q=80",
    ],
    host: hosts.priya,
    price: "$12",
    tags: ["Music", "Indoor"],
    phone: "(415) 555-0190",
    websiteLabel: "littlenotes.studio",
    attendees: [
      {
        id: "a9",
        name: "Hana",
        avatarUrl:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80",
      },
    ],
    reviews: [
      {
        id: "r5",
        author: "Hana Liu",
        avatarUrl:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=80",
        rating: 5,
        dateLabel: "4 days ago",
        text: "Tiny class, live guitar, and a goodbye song my toddler now demands at home.",
      },
    ],
  },
  {
    id: "storytime-library",
    title: "Storytime for Littles",
    category: "class",
    ageRange: "Ages 0–3",
    rating: 4.5,
    reviewCount: 152,
    goingCount: 22,
    startsAt: "2026-08-19T11:00:00",
    endsAt: "2026-08-19T11:30:00",
    address: "San Francisco Public Library, 100 Larkin St",
    neighborhood: "Civic Center",
    city: "San Francisco, CA",
    latitude: 37.779,
    longitude: -122.4156,
    description:
      "Board books, puppets, and a few songs in the children's center. Come early for floor seats. Strollers can wait in the designated hall.",
    photos: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
    ],
    host: hosts.priya,
    price: "Free",
    tags: ["Books", "Indoor"],
    websiteLabel: "sfpl.org",
    attendees: [
      {
        id: "a10",
        name: "Rico",
        avatarUrl:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80",
      },
      {
        id: "a11",
        name: "Jules",
        avatarUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80",
      },
    ],
    reviews: [
      {
        id: "r6",
        author: "Jules D.",
        avatarUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80",
        rating: 4,
        dateLabel: "1 week ago",
        text: "Classic library storytime. Gets packed—arrive 10 minutes early.",
      },
    ],
  },
  {
    id: "family-market",
    title: "Weekend Family Market",
    category: "market",
    ageRange: "All ages",
    rating: 4.4,
    reviewCount: 311,
    goingCount: 48,
    startsAt: "2026-08-23T09:00:00",
    endsAt: "2026-08-23T13:00:00",
    address: "Ferry Building Marketplace, 1 Ferry Building",
    neighborhood: "Embarcadero",
    city: "San Francisco, CA",
    latitude: 37.7955,
    longitude: -122.3937,
    description:
      "Produce, baked goods, and a few kid-height vendors. Look for the yellow balloon cluster near the baby-gear swap table.",
    photos: [
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    ],
    host: hosts.sam,
    price: "Free entry",
    tags: ["Market", "Weekend"],
    attendees: [
      {
        id: "a12",
        name: "Pat",
        avatarUrl:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80",
      },
    ],
    reviews: [
      {
        id: "r7",
        author: "Pat Nguyen",
        avatarUrl:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=80",
        rating: 4,
        dateLabel: "2 weeks ago",
        text: "Crowded but worth it for the fruit and the stroller-friendly aisles.",
      },
    ],
  },
  {
    id: "gear-swap",
    title: "Diaper & Gear Swap",
    category: "market",
    ageRange: "All ages",
    rating: 4.8,
    reviewCount: 54,
    goingCount: 15,
    startsAt: "2026-08-22T11:00:00",
    endsAt: "2026-08-22T13:00:00",
    address: "Dogpatch Arts Plaza, 22nd St & 3rd St",
    neighborhood: "Dogpatch",
    city: "San Francisco, CA",
    latitude: 37.7576,
    longitude: -122.3886,
    description:
      "Bring outgrown carriers, unsopened diapers, and clothes. Take what your family can use. Sam labels sizes and keeps a leftover-donation bin.",
    photos: [
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1200&q=80",
    ],
    host: hosts.sam,
    price: "Free",
    tags: ["Swap", "Gear"],
    attendees: [
      {
        id: "a13",
        name: "Ivy",
        avatarUrl:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=80&q=80",
      },
      {
        id: "a14",
        name: "Noah",
        avatarUrl:
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=80&q=80",
      },
    ],
    reviews: [
      {
        id: "r8",
        author: "Ivy Chen",
        avatarUrl:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=80&q=80",
        rating: 5,
        dateLabel: "5 days ago",
        text: "Left with a better carrier and zero guilt about the unused size 2s.",
      },
    ],
  },
  {
    id: "tummy-time-picnic",
    title: "Tummy Time Picnic",
    category: "playdate",
    ageRange: "Ages 0–9 mo",
    rating: 4.9,
    reviewCount: 73,
    goingCount: 14,
    startsAt: "2026-08-20T10:00:00",
    endsAt: "2026-08-20T11:30:00",
    address: "Dolores Park, south lawn",
    neighborhood: "Mission Dolores",
    city: "San Francisco, CA",
    latitude: 37.7596,
    longitude: -122.4269,
    description:
      "Blankets, shade sails, and a slow morning on the grass. Siblings can roam the nearby path. Lena posts a weather call the night before.",
    photos: [
      "https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1200&q=80",
    ],
    host: hosts.lena,
    price: "Free",
    tags: ["Picnic", "Park"],
    attendees: [
      {
        id: "a15",
        name: "Wren",
        avatarUrl:
          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=80&q=80",
      },
    ],
    reviews: [
      {
        id: "r9",
        author: "Wren Patel",
        avatarUrl:
          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=80&q=80",
        rating: 5,
        dateLabel: "Last Sunday",
        text: "Softest landing for a first outing. Other parents actually talked to us.",
      },
    ],
  },
  {
    id: "sunset-support",
    title: "Evening Parent Hangout",
    category: "meetup",
    ageRange: "All ages",
    rating: 4.6,
    reviewCount: 41,
    goingCount: 11,
    startsAt: "2026-08-21T18:30:00",
    endsAt: "2026-08-21T20:00:00",
    address: "Inner Sunset, 9th Ave & Irving St",
    neighborhood: "Inner Sunset",
    city: "San Francisco, CA",
    latitude: 37.7639,
    longitude: -122.4665,
    description:
      "An after-dinner sidewalk hang for grown-ups who want company more than programming. Babies in carriers, toddlers with snacks, and a backup indoor table if fog rolls in.",
    photos: [
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1200&q=80",
    ],
    host: hosts.lena,
    price: "Free",
    tags: ["Evening", "Neighborhood"],
    attendees: [
      {
        id: "a16",
        name: "Bo",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
      },
    ],
    reviews: [
      {
        id: "r10",
        author: "Bo Ramirez",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=80",
        rating: 5,
        dateLabel: "Last Thursday",
        text: "Low-key and local. Felt more like neighbors than a meetup.",
      },
    ],
  },
];

export const CATEGORY_FILTERS: { id: EventCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "playdate", label: "Playdates" },
  { id: "class", label: "Classes" },
  { id: "meetup", label: "Meetups" },
  { id: "outdoors", label: "Outdoors" },
  { id: "market", label: "Markets" },
];

export function createMockEventsAround(
  center: GeoPoint,
  area: AreaLabel = FALLBACK_AREA,
): BabyEvent[] {
  return EVENTS.map((event) => {
    const layout = EVENT_LAYOUT[event.id];
    return {
      ...event,
      latitude: center.latitude + (layout?.lat ?? 0),
      longitude: center.longitude + (layout?.lng ?? 0),
      neighborhood: area.neighborhood,
      city: area.city,
      address: `${layout?.placeName ?? event.title}, ${area.areaLabel}`,
    };
  });
}

export function searchEvents(
  events: BabyEvent[],
  query: string,
  category: EventCategory | "all",
) {
  const normalized = query.trim().toLowerCase();
  return events.filter((event) => {
    const categoryOk = category === "all" || event.category === category;
    if (!categoryOk) return false;
    if (!normalized) return true;
    const haystack = [
      event.title,
      event.address,
      event.neighborhood,
      event.city,
      event.host.name,
      event.host.handle,
      event.ageRange,
      ...event.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalized);
  });
}
