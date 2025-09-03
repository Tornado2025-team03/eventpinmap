import { Platform } from "react-native";
import * as Location from "expo-location";
import type { Coordinates } from "../types/event";

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

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
