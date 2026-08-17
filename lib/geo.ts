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
