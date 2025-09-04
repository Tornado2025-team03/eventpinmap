import { Platform } from "react-native";
import * as Location from "expo-location";
import type { Coordinates } from "../types/event";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;
export const hasGooglePlacesKey = !!GOOGLE_KEY;

export async function geocodeAddress(
  address: string,
): Promise<(Coordinates & { formattedAddress: string }) | null> {
  if (!address?.trim()) return null;

  if (!GOOGLE_KEY) {
    // フォールバック: 端末ジオコーダは住所→座標は未対応のため null
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address,
  )}&key=${GOOGLE_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== "OK" || !json.results?.length) return null;
  const top = json.results[0];
  const { lat, lng } = top.geometry.location;
  return {
    latitude: lat,
    longitude: lng,
    formattedAddress: top.formatted_address,
  };
}

export async function reverseGeocode(
  coords: Coordinates,
): Promise<string | null> {
  try {
    const arr = await Location.reverseGeocodeAsync({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    if (!arr?.length) return null;
    const a = arr[0];
    const parts = [a.country, a.region, a.city, a.district, a.street, a.name]
      .filter(Boolean)
      .join(" ");
    return parts || null;
  } catch (e) {
    return null;
  }
}

// --- Places Autocomplete ---
type PlacePrediction = { description: string; place_id: string };

export async function autocompletePlaces(
  input: string,
): Promise<PlacePrediction[]> {
  if (!GOOGLE_KEY || !input?.trim()) return [];
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input,
  )}&key=${GOOGLE_KEY}&language=ja`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== "OK" || !json.predictions) {
    console.warn(
      "Places autocomplete failed:",
      json.status,
      json.error_message,
    );
    return [];
  }
  return json.predictions.map((p: any) => ({
    description: p.description,
    place_id: p.place_id,
  }));
}

export async function getPlaceDetails(
  placeId: string,
): Promise<
  (Coordinates & { name?: string; formattedAddress?: string }) | null
> {
  if (!GOOGLE_KEY || !placeId) return null;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
    placeId,
  )}&key=${GOOGLE_KEY}&language=ja`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== "OK" || !json.result) {
    console.warn("Place details failed:", json.status, json.error_message);
    return null;
  }
  const r = json.result;
  const loc = r.geometry?.location;
  if (!loc) return null;
  return {
    latitude: loc.lat,
    longitude: loc.lng,
    name: r.name,
    formattedAddress: r.formatted_address,
  };
}
