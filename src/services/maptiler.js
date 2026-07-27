import * as maptilersdk from '@maptiler/sdk';

maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

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
      return data.features.map((f) => ({
        name: f.text,
        country: f.properties.place_designation == 'country' ? f.text : f.context.find((c) => c?.place_designation == 'country' )?.text,
        country_code: f.properties.country_code.toUpperCase(),
        latitude: f.center[1],
        longitude: f.center[0],
        place_name: f.place_name
      }))
    })
    .catch((error) => {
      throw new error;
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
      return data.features.map((f) => ({
        name: f.text,
        country: f.properties.place_designation == 'country' ? f.text : f.context.find((c) => c?.place_designation == 'country' )?.text,
        country_code: f.properties.country_code.toUpperCase(),
        latitude: f.center[1],
        longitude: f.center[0],
        place_name: f.place_name
      }))
    })
    .catch((error) => {
      throw new error;
    })
}

// export with the key set
export {
  maptilersdk
};