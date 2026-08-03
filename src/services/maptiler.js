import * as maptilersdk from '@maptiler/sdk';

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

// helper function to map out map tiler location search response
function mapMapTilerLocationResponse(res) {
  return {
    name: res.text,
    // map tiler data can be messy...
    country: res.id.includes('country')
      ? res.text
      : res.context.find((c) => c.id.includes('country'))?.text,
    country_code: res.properties?.country_code
      ?? res.context.find((c) => c.id.includes('country'))?.country_code,
    latitude: res.center[1],
    longitude: res.center[0],
    place_name: res.place_name
  };
}

/**
 * Searches for a location by name and returns geocoding results.
 * @param {string} q - The query to search for.
 * @param {object} options - Additonal query params. https://docs.maptiler.com/cloud/api/geocoding/
 * @returns {Promise<object>} The API response body.
 */
export async function searchCity(q, options = {}) {
  if (!q || !q.trim()) {
    throw new Error('A Query is required');
  }

  return maptilersdk.geocoding.forward(q, options)
    .then((data) => {
      // return an object with the data we actually need
      return data.features.map((f) => mapMapTilerLocationResponse(f))
    })
    .catch((error) => {
      console.error(error)
      throw new Error(error);
    })
}

/**
 * 
 * @param {Number} latitude
 * @param {Number} longitude
 * @param {*} options 
 */
export async function reverseSearch(latitude, longitude, options = {}) {
  return maptilersdk.geocoding.reverse([longitude, latitude], options)
    .then((data) => {
      // return an object with the data we actually need
      return data.features.map((f) => mapMapTilerLocationResponse(f))
    })
    .catch((error) => {
      console.error(error)
      throw new Error(error);
    })
}

// export with the key set
export {
  maptilersdk
};