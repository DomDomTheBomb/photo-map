import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getLocations() {
  const { data, error } = await supabase.from('locations').select('*');

  if (error) throw error;
  return data;
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

// Upload file using supabase upload
export async function uploadFileToSupabase(file) {
  const fileName = `photos/${crypto.randomUUID()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('Travel Photos')
    .upload(fileName, file);

  if (error) {
    throw new error(error);
  }

  return data;
}
