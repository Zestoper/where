    import type { Facility } from "../types/facility";

    export async function fetchNearbyFacilities(
    lat: number,
    lng: number,
    radius = 500
    ): Promise<Facility[]> {
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/facilities/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
    }
