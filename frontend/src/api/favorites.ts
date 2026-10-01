const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1/favorites/`;

export interface Favorite {
  id: string;
  location_id: string;
  device_id: string;
  create_at: string;
}

export async function listFavorites(deviceId: string): Promise<Favorite[]> {
  const response = await fetch(`${BASE_URL}?device_id=${encodeURIComponent(deviceId)}`);
  return response.json();
}

export interface FavoriteLocation {
  id: string;
  category: string;
  lname: string;
  addr: string;
  lat: number;
  lng: number;
}

export async function listFavoriteLocations(deviceId: string): Promise<FavoriteLocation[]> {
  const response = await fetch(`${BASE_URL}detailed?device_id=${encodeURIComponent(deviceId)}`);
  return response.json();
}

export async function addFavorite(locationId: string, deviceId: string): Promise<Favorite> {
  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location_id: locationId, device_id: deviceId }),
  });
  return response.json();
}

export async function removeFavorite(locationId: string, deviceId: string): Promise<void> {
  await fetch(
    `${BASE_URL}?location_id=${encodeURIComponent(locationId)}&device_id=${encodeURIComponent(deviceId)}`,
    { method: "DELETE" }
  );
}
