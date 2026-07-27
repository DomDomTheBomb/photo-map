import Select from '../ui/Select';
import AddNewLocation from './AddNewLocation';
import CloseIcon from '@mui/icons-material/Close';

import LocationStore from '../../store/locations';

import { useState } from 'react';

function PhotoInfoReview({ filesForUpload, onFileUpdate, onRemove }) {
  const locations = LocationStore((state) => state.locations);

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [presetLocation, setPresetLocation] = useState(null);

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

  return (
    <>
      <AddNewLocation
        className="z-70"
        isOpen={locationDialogOpen}
        onClose={() => setLocationDialogOpen(false)}
        preLoadCoords={presetLocation}
      />
      <div>
        <div>
          <span className="text-2xl font-medium"> Review Photos </span>
        </div>


        {/* list of photos and details */}
        <div className="max-h-[60vh] overflow-y-auto">
        {/* Have drop down to assign location to all photos */}
        <div className="flex flex-col ml-1">
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
          {/* render list of photos */}
          {filesForUpload.map((f, i) => (
            <div key={i} className="my-2 flex rounded-lg border group relative">
              {/* for removing photo. Only show when hovering over parent div */}
              <button
                onClick={() => onRemove(i)}
                className="absolute m-1 top-0 right-0 bg-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </button>

              {/* Fixed 40x40 container; object-cover crops to fill without distortion, object-center keeps the subject centered */}
              <img
                className="m-0.75 h-30 w-30 object-cover object-center rounded-lg border"
                src={URL.createObjectURL(f)}
              />
              <div className="flex flex-col mx-3 my-1">
                <span className=""> {f.name} </span>
                {/* EXIF data was already parsed in PhotoPicker and attached to f.exif — no async needed here */}
                <span className="text-sm">
                  {' '}
                  {f.uploadInfo.dateTaken?.toLocaleDateString() ??
                    'No date'}{' '}
                </span>
                {/* Pre-seed the Select with the nearest location's id if GPS data is available */}
                <Select
                  items={locations}
                  valueKey="id"
                  labelKey="name"
                  placeholder="select a location..."
                  value={f.uploadInfo.locationId ?? undefined}
                  prependItem={
                    <button onClick={() => {sendLocationCoordinates(i); setLocationDialogOpen(true)}}>
                      Add New Location
                    </button>
                  }
                  onChange={(locationId) =>
                    onFileUpdate(i, 'locationId', locationId)
                  }
                >
                  <button> Add New Location </button>
                </Select>
                <input
                  className="field-inputs"
                  type="text"
                  placeholder="write a caption..."
                  value={f.uploadInfo.caption ?? ''}
                  onChange={(e) => onFileUpdate(i, 'caption', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default PhotoInfoReview;
