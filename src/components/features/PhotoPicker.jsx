import Dialog from '../ui/Dialog';
import AddPhoto from './AddPhoto';
import PhotoInfoReview from './PhotoInfoReview';

import LocationStore from '../../store/locations';
import { getDistance } from '../../helpers/distance';
import {
  uploadFileToSupabase,
  insertPhotoTableRow,
} from '../../services/supabase';

import { useState, useMemo } from 'react';
import exifr from 'exifr';

function PhotoPicker({ isOpen, onClose }) {
  const locations = LocationStore((state) => state.locations);

  // keeps track of what stage user is on
  // 1 - add photos
  // 2 - review photo info
  const [stage, setStage] = useState(1);
  // for storing the files that user will upload
  const [filesForUpload, setFilesForUpload] = useState([]);
  // for determining if upload button should be enabled
  const canUpload = useMemo(() => {
    // require files to have location info
    return filesForUpload.some((f) => f.uploadInfo.locationId == null);
  }, [filesForUpload]);

  // remove a file from the upload list by its index
  function handleRemove(index) {
    setFilesForUpload((v) => v.filter((_, i) => i !== index));
  }

  // handles setting file upload info
  function handleFileUploadInfoUpdate(index, field, value) {
    setFilesForUpload((v) => {
      // copy over existing data
      const newVal = [...v];
      // update file with new one given its index
      newVal[index].uploadInfo[field] = value;

      // if field is location, we must also get the long and lat data
      if (field == 'locationId') {
        const loc = locations.find((l) => l.id == value);

        if (!newVal[index].uploadInfo.lat)
          newVal[index].uploadInfo.lat = loc.lat;
        if (!newVal[index].uploadInfo.long)
          newVal[index].uploadInfo.long = loc.long;
      }

      return newVal;
    });
  }

  // Cancel action. Reset list, stage and close dialog
  function cancel() {
    setFilesForUpload([]);
    setStage(1);
    onClose();
  }

  // Returns the full location object nearest to the given coordinates,
  // so callers can access any property (id, name, city, etc.)
  function getNearestLocation(x, y) {
    let nearestLoc = null;
    let nearestLocDist = 10000; // arbitrary cap for now

    locations.forEach((l) => {
      let d = getDistance(x, y, l.long, l.lat);
      if (d < nearestLocDist) {
        nearestLoc = l;
        nearestLocDist = d;
      }
    });

    return nearestLoc;
  }

  // exifr methods are async, so we parse all dropped files in parallel,
  // then attach the EXIF result to each file object before storing them
  async function handleSetFiles(acceptedFiles) {
    const filesWithExif = await Promise.all(
      acceptedFiles.map(async (file) => {
        const exif = (await exifr.parse(file)) ?? {};
        const gps = (await exifr.gps(file)) ?? {};
        // Attach the parsed EXIF data directly onto the file object so
        // downstream components (e.g. PhotoInfoReview) can read it easily
        file.exif = exif;
        file.gps = gps;
        // represents data that would be uploaded to db
        file.uploadInfo = {
          locationId: null,
          storagePath: null,
          caption: null,
          lat: gps?.latitude,
          long: gps?.longitude,
          dateTaken: exif?.DateTimeOriginal,
        };

        // if there is valid gpd coordinates, set location and lat and long
        if (gps?.latitude && gps?.longitude) {
          const loc = getNearestLocation(gps.longitude, gps.latitude);

          // set location info if one was returned
          if (loc) file.uploadInfo.locationId = loc.id;
        }

        return file;
      })
    );

    setFilesForUpload((v) => [...v, ...filesWithExif]);
  }

  async function uploadPhotos() {
    // arbitrary. Set to this for now unless we ever change it
    const batchSize = 5;
    const photoBatches = [];

    // create batches
    for (let i = 0; i < filesForUpload.length; i += batchSize) {
      photoBatches.push(filesForUpload.slice(i, i + batchSize));
    }

    // start upload process
    for (const [x, batch] of photoBatches.entries()) {
      await Promise.all(batch.map((b) => uploadFileToSupabase(b)))
        .then((data) => {
          data.forEach((upload, y) => {
            // convert batch number to array index of file
            const fileIndex = x * batchSize + y;
            // then set file upload id and storage path
            handleFileUploadInfoUpdate(fileIndex, 'storagePath', upload.path);
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }

    // update tables to reflect uploaded photos
    // build object
    const photoTableInsertData = filesForUpload.map((photoInfo) => ({
      location_id: photoInfo.uploadInfo.locationId,
      storage_path: photoInfo.uploadInfo.storagePath,
      caption: photoInfo.uploadInfo.caption,
      lat: photoInfo.uploadInfo.lat,
      long: photoInfo.uploadInfo.long,
      date_taken: photoInfo.uploadInfo.dateTaken,
    }));

    // upload information
    await insertPhotoTableRow(photoTableInsertData)
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        throw error;
        console.log(error);
      });

    // close and reset dialog
    cancel();
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      {/* Stage 1 for adding photos */}
      {stage == 1 && (
        <AddPhoto
          filesForUpload={filesForUpload}
          setFiles={handleSetFiles}
          removeFile={handleRemove}
        />
      )}

      {/* Stage 2 is for reviewing photo information */}
      {stage == 2 && (
        <PhotoInfoReview
          filesForUpload={filesForUpload}
          onFileUpdate={handleFileUploadInfoUpdate}
          onRemove={handleRemove}
        />
      )}

      <div className="text-right">
        {/* takes user to review photo info step */}
        {stage == 1 && (
          <button
            className="app-button bg-primary disabled:opacity-70 disabled:cursor-default"
            onClick={() => setStage((s) => s + 1)}
            disabled={filesForUpload.length == 0}
          >
            Next
          </button>
        )}

        {/* upload photos */}
        {stage == 2 && (
          <button
            className="app-button bg-primary disabled:opacity-70 disabled:cursor-default"
            disabled={filesForUpload.length == 0}
            onClick={uploadPhotos}
            disabled={canUpload}
          >
            Upload
          </button>
        )}

        {/* Take user back to first step */}
        {stage == 2 && (
          <button
            className="app-button bg-primary"
            onClick={() => setStage((s) => s - 1)}
          >
            Back
          </button>
        )}

        <button className="app-button bg-gray-400" onClick={cancel}>
          {' '}
          Cancel{' '}
        </button>
      </div>
    </Dialog>
  );
}

export default PhotoPicker;
