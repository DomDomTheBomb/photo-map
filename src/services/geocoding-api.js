// Base URL for the Open-Meteo Geocoding API
const BASE_URL = "https://geocoding-api.open-meteo.com/v1";

/**
 * Makes a GET request to the Open-Meteo Geocoding API.
 * Shared helper used by all functions in this file.
 */
async function get(endpoint, params = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);

  // Append query params to the URL
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `Geocoding API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

/**
 * Searches for a city by name and returns geocoding results.
 * @param {string} city - The city name to search for.
 * @param {object} options - Optional params (e.g. count, language, format).
 * @returns {Promise<object>} The API response body.
 */
export async function searchCity(city, options = {}) {
  if (!city || !city.trim()) {
    throw new Error("City name is required");
  }

  return get("/search", { name: city, ...options });
}