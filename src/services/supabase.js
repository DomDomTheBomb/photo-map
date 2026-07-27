import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// retrieve all locations
export async function getLocations() {
  const { data, error } = await supabase.from('locations').select('*').order('name');

  if (error) throw error;
  return data;
}

// retrieve photos of a given location
export async function getPhotosForLocation(locationID) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('location_id', locationID)
    .order('date_taken', {ascending: false});

  if (error) throw new error();

  return data;
}

// removes photo given its ID
export async function deletePhotoRow(photoID) {
  const { error } = await supabase.from('photos').delete().eq('id', photoID);

  if (error) throw new error();
}

/**
 * insert table rows into the photos supabase table
 * @param {Object[]} insertRows
 */
export async function insertPhotoTableRow(insertRows) {
  const { data, error } = await supabase.from('photos').insert(insertRows);

  if (error) {
    throw new error();
  }

  return data;
}

/**
 * insert table rows into the locations supabase table
 * @param {Object[]} insertRows
 */
export async function insertLocationTableRow(insertRow) {
  const { data, error } = await supabase
    .from('locations')
    .insert(insertRow)
    .select();

  if (error) {
    throw new error();
  }

  return data;
}

// Upload file using supabase upload
export async function uploadFileToSupabase(file, path, name = null) {
  let fileName = `${path}/${crypto.randomUUID()}`;
  // add name if given
  if (name) {
    fileName += `-${name}`;
  }

  const { data, error } = await supabase.storage
    .from('Travel Photos')
    .upload(fileName, file);

  if (error) {
    throw new error(error);
  }

  return data;
}

// remove files from supabase
export async function deleteFileFromSupabase(paths) {
  const { error } = await supabase.storage.from('Travel Photos').remove(paths);

  if (error) {
    throw new error(error);
  }
}
