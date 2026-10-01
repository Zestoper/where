export interface SearchResult {
  lat: number;
  lng: number;
  address: string;
}

export async function searchLocation(query: string): Promise<SearchResult[]> {
  const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/search/?query=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  return response.json();
}
