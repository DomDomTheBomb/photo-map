// Resize a File/Blob to a max dimension, return a Blob
export async function resizeImage(
  source,
  maxDimension,
  quality = 0.82,
  format = 'image/webp'
) {
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height)
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        // Release the canvas GPU backing store immediately rather than waiting for GC
        canvas.width = 0;
        blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'));
      },
      format,
      quality
    );
  });
}
