export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type AreaLabel = {
  neighborhood: string;
  city: string;
  areaLabel: string;
};

export const DEFAULT_LOCATION: GeoPoint = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export const FALLBACK_AREA: AreaLabel = {
  neighborhood: "Nearby",
  city: "Near you",
  areaLabel: "Near you",
};

export const DEMO_RICHMOND_HILL: GeoPoint = {
  latitude: 43.8828,
  longitude: -79.4403,
};

export const JUMP_AREAS: { name: string; point: GeoPoint }[] = [
  { name: "Richmond Hill", point: DEMO_RICHMOND_HILL },
  { name: "Oak Ridges", point: { latitude: 43.943, longitude: -79.456 } },
  { name: "Mill Pond", point: { latitude: 43.874, longitude: -79.437 } },
  { name: "Bayview Hill", point: { latitude: 43.868, longitude: -79.41 } },
  { name: "Crosby", point: { latitude: 43.89, longitude: -79.45 } },
  { name: "Elgin Mills", point: { latitude: 43.905, longitude: -79.44 } },
];

export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function getBrowserLocation(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60_000,
      },
    );
  });
}

type NominatimAddress = {
  house_number?: string;
  road?: string;
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
};

export async function reverseGeocode(point: GeoPoint): Promise<AreaLabel> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(point.latitude));
    url.searchParams.set("lon", String(point.longitude));

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return FALLBACK_AREA;

    const data = (await response.json()) as {
      address?: NominatimAddress;
    };
    const address = data.address ?? {};
    const neighborhood =
      address.suburb ||
      address.neighbourhood ||
      address.quarter ||
      address.city_district ||
      address.road ||
      "Nearby";
    const cityName =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "";
    const city = [cityName, address.state].filter(Boolean).join(", ") || "Near you";
    const street = [address.house_number, address.road].filter(Boolean).join(" ");
    const areaLabel =
      [street || neighborhood, cityName || city].filter(Boolean).join(", ") ||
      FALLBACK_AREA.areaLabel;

    return { neighborhood, city, areaLabel };
  } catch {
    return FALLBACK_AREA;
  }
}
