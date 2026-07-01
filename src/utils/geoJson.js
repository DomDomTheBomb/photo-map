/**
 * Converts a locations array from Supabase into a GeoJSON FeatureCollection
 * suitable for use as a MapTiler/MapLibre source.
 *
 * Note: GeoJSON requires [longitude, latitude] order (opposite of lat/lng).
 */
export function locationsToGeoJson(locations) {
  return {
    type: 'FeatureCollection',
    features: locations.map((loc) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [loc.long, loc.lat], // longitude first in GeoJSON spec
      },
      properties: {
        id: loc.id,
        name: loc.name,
        city: loc.city,
        country_iso_code: loc.country_iso_code,
        date_visited: loc.date_visited,
      },
    })),
  };
}
