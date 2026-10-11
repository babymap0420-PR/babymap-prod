export type LocationKind = "place" | "event";
export type TypeTab = "all" | "place" | "event";
export type CostType = "free" | "paid";

export type PlaceDetails = {
  operating_hours: Record<string, string> | null;
  seasonal_status: "year_round" | "seasonal" | null;
  season_open_date: string | null;
  season_close_date: string | null;
  indoor_outdoor: "indoor" | "outdoor" | "both" | null;
  surface_type: string | null;
  fenced: boolean | null;
  amenities: string[] | null;
  busiest_times: string | null;
  nearby_amenities: string[] | null;
};

export type EventDetails = {
  id: string;
  start_datetime: string;
  end_datetime: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  registration_required: boolean;
  registration_url: string | null;
  host_name: string;
  host_type: "city" | "library" | "business" | "community_group" | null;
  weather_dependent: boolean | null;
  cancellation_policy: string | null;
};

export type LocationReview = {
  id: string;
  user_id?: string | null;
  body: string;
  photo_url: string | null;
  created_at: string;
  display_name: string;
  status?: string | null;
  rating?: number | null;
};

export type MapLocation = {
  id: string;
  type: LocationKind;
  name: string;
  description: string | null;
  cover_photo_url: string | null;
  photo_urls: string[] | null;
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: string | null;
  website_url: string | null;
  age_tags: string[];
  category: string;
  cost_type: CostType;
  cost_detail: string | null;
  accessibility_notes: string[] | null;
  parking_available: boolean | null;
  upvote_count: number;
  review_count: number;
  average_rating?: number | null;
  favourite_count: number;
  distance_m: number | null;
  status: string;
  submitted_by?: string | null;
  place_details: PlaceDetails | null;
  event_details: EventDetails | null;
  is_favourite?: boolean;
  reviews?: LocationReview[];
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  earned?: boolean;
  earned_at?: string;
  criteria_type?: string;
  criteria_threshold?: number;
};
