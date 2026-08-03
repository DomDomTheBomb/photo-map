import Select from '../ui/Select';
import AddNewLocation from './AddNewLocation';
import CloseIcon from '@mui/icons-material/Close';

import LocationStore from '../../store/locations';
import { getDistance } from '../../helpers/distance';

import { useState, useMemo, useEffect, memo } from 'react';
import { formControlClasses } from '@mui/material/FormControl';

// Isolated card component so only the changed card re-renders, not all cards
const PhotoCard = memo(function PhotoCard({ file, objectUrl, index, locations, onFileUpdate, onRemove, onOpenLocationDialog }) {
  // Local caption state so keystrokes don't trigger parent re-renders
  const [caption, setCaption] = useState(file.uploadInfo.caption ?? '');

  return (
    <div key={index} className="my-2 flex min-w-0 grow rounded-lg border group relative">
      {/* for removing photo. Only show when hovering over parent div */}
      <button
        onClick={() => onRemove(index)}
        className="absolute m-1 top-0 right-0 bg-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <CloseIcon sx={{ fontSize: 12 }} />
      </button>

      {/* Fixed 40x40 container; object-cover crops to fill without distortion, object-center keeps the subject centered */}
      <img
        className="m-0.75 h-30 w-45 object-cover object-center rounded-lg border"
        src={objectUrl}
      />
      <div className="flex flex-col min-w-0 mx-3 my-1">
        <span className="truncate"> {file.name} </span>
        {/* EXIF data was already parsed in PhotoPicker and attached to f.exif — no async needed here */}
        { file.uploadInfo.dateTaken ? (
            <span className="text-sm">
              {file.uploadInfo.dateTaken?.toLocaleDateString() ??
                'No date'}
            </span>
          ) :
          (
            <input
              className="field-inputs"
              type="date"
              placeholder="Assign a date..."
              value={file.uploadInfo.dateTaken}
              onChange={(e) => onFileUpdate(index, 'dateTaken', new Date(e.target.value))}
            />
          )
        }

        {/* Pre-seed the Select with the nearest location's id if GPS data is available */}
        <Select
          items={locations}
          valueKey="id"
          labelKey="name"
          placeholder="select a location..."
          value={file.uploadInfo.locationId}
          prependItem={
            <button onClick={() => onOpenLocationDialog(index)}>
              Add New Location
            </button>
          }
          onChange={(locationId) =>
            onFileUpdate(index, 'locationId', locationId)
          }
        >
          <button> Add New Location </button>
        </Select>

        {/* Caption uses local state — keystrokes stay fast and local.
            Parent state only updates on blur to avoid per-keystroke re-renders. */}
        <input
          className="field-inputs"
          type="text"
          placeholder="write a caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={(e) => onFileUpdate(index, 'caption', e.target.value)}
        />
      </div>
    </div>
  );
});

function PhotoInfoReview({ filesForUpload, onFileUpdate, onRemove }) {
  const locations = LocationStore((state) => state.locations);

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [presetLocation, setPresetLocation] = useState(null);
  // used to keep track of photo that triggers new Location Dialog
  const [sourcePhotoIndex, setSourcePhotoIndex] = useState(null);

  // Create object URLs once per filesForUpload change, not on every render
  const objectUrls = useMemo(
    () => filesForUpload.map((f) => URL.createObjectURL(f)),
    [filesForUpload]
  );

  // Revoke URLs when filesForUpload changes to avoid memory leaks
  useEffect(() => {
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [objectUrls]);

  // assign location to all photos
  function assignAllLocation(locationId) {
    filesForUpload.forEach((f, i) => onFileUpdate(i, 'locationId', locationId))
  }

  // send coordinates to new location dialog in case photo already has it
  function sendLocationCoordinates(i) {
    // if we have both valid lat and long, send it
    if (filesForUpload[i].gps?.latitude && filesForUpload[i].gps?.longitude) {
      setPresetLocation([filesForUpload[i].gps.latitude, filesForUpload[i].gps.longitude])
    }
  }

  /**
   * given a location's ID, check if photos are nearby given the
   * threshold distanxe. Assign loction to photos when within range
   * @param {Object} location
   * @param {number} [distanceTreshold=10000] - range distance in meters for photo location assignment
   */
  function crossCheckPhotoCoordsWithNewLocation(location, distanceTreshold = 10000) {
    if (sourcePhotoIndex != null) onFileUpdate(sourcePhotoIndex, 'locationId', location.id)

    filesForUpload.forEach((f, i) => {
      const uploadInfo = f.uploadInfo
      // only update if valid coords and no current location
      if (uploadInfo?.lat && uploadInfo?.long && !uploadInfo.locationId) {
        const dist = getDistance(uploadInfo.lat, uploadInfo.long, location.lat, location.long)
        if (dist <= distanceTreshold) onFileUpdate(i, 'locationId', location.id)
      }
    })
  }

  // do some clean up when new location dialog closes
  function closeNewLocationDialog() {
    setPresetLocation(null);
    setSourcePhotoIndex(null);
    setLocationDialogOpen(false);
  }

  /**
   * Opens new location dialog and sets props to initialize dialog
   * @param {number} i photo index
   */
  function openNewLocationDialogFromPhoto(i) {
    sendLocationCoordinates(i);
    setSourcePhotoIndex(i);
    setLocationDialogOpen(true);
  }

  return (
    <>
      <AddNewLocation
        className="z-70"
        isOpen={locationDialogOpen}
        onClose={closeNewLocationDialog}
        preLoadCoords={presetLocation}
        onLocationCreated={crossCheckPhotoCoordsWithNewLocation}
      />
      <div>
        <div>
          <span className="text-2xl font-medium"> Review Photos </span>
        </div>

        {/* list of photos and details */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Have drop down to assign location to all photos */}
          <div className="flex flex-col ml-1 w-80">
            <span className="text-sm mt-2"> Assign location to all </span>
            <Select
              className='ml-1'
              items={locations}
              valueKey="id"
              labelKey="name"
              placeholder="select a location..."
              prependItem={
                <button onClick={() => setLocationDialogOpen(true)}>
                  Add New Location
                </button>
              }
              onChange={(locationId) =>
                assignAllLocation(locationId)
              }
            >
              <button> Add New Location </button>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2 px-2">
            {/* render list of photos as isolated memoized cards */}
            {filesForUpload.map((f, i) => (
              <PhotoCard
                key={i}
                file={f}
                objectUrl={objectUrls[i]}
                index={i}
                locations={locations}
                onFileUpdate={onFileUpdate}
                onRemove={onRemove}
                onOpenLocationDialog={openNewLocationDialogFromPhoto}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default PhotoInfoReview;
