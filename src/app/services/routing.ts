// OSRM Routing Service
// Free routing API: https://router.project-osrm.org/route/v1/driving/{startLng},{startLat};{endLng},{endLat}?overview=full&geometries=geojson

export interface RouteResponse {
  code: string;
  routes: Array<{
    geometry: {
      coordinates: Array<[number, number]>; // [lng, lat] format
      type: string;
    };
    legs: Array<{
      distance: number; // meters
      duration: number; // seconds
      summary: string;
    }>;
    distance: number; // meters
    duration: number; // seconds
  }>;
}

export async function getRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<{ coordinates: Array<[number, number]>; distanceKm: number; durationSeconds: number } | null> {
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
    );
    
    if (!response.ok) {
      console.error('OSRM API error:', response.statusText);
      return null;
    }

    const data: RouteResponse = await response.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.error('OSRM: No route found');
      return null;
    }

    const route = data.routes[0];
    
    // Convert [lng, lat] to [lat, lng] for Leaflet
    const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    const distanceKm = route.distance / 1000; // Convert meters to km
    const durationSeconds = route.duration;

    return { coordinates, distanceKm, durationSeconds };
  } catch (error) {
    console.error('Failed to fetch route:', error);
    return null;
  }
}

// Calculate ETA based on distance and average speed (assuming 30 km/h average in urban areas)
export function calculateETA(distanceKm: number, averageSpeedKmH: number = 30): number {
  if (distanceKm <= 0) return 0;
  return Math.ceil((distanceKm / averageSpeedKmH) * 60); // Return minutes
}

// Format ETA for display
export function formatETAMinutes(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
