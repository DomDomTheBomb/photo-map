import { useState, useEffect, useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from "yet-another-react-lightbox/plugins/captions";
import CloseIcon from '@mui/icons-material/Close';

import Dialog from '../ui/Dialog';
import Spinner from '../ui/spinner/spinner';

import useLocations from '../../store/locations';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { MD_BREAKPOINT } from '../../helpers/const';

import 'yet-another-react-lightbox/styles.css';
import "yet-another-react-lightbox/plugins/captions.css";

import {
  supabase,
  deleteFileFromSupabase,
  deletePhotoRow,
} from '../../services/supabase';
import { isObject } from 'lodash';

const BUCKET_URL = `${import.meta.env.VITE_SUPABASE_URL}storage/v1/object/public/Travel Photos/`;

function PhotoCarousel({ isOpen = false, onClose, isLoading = false, name="" }) {
  const isAdmin = useIsAdmin();

  // determine size for dialog window
  const [photoGridWidth, photoGridHeight] = window.innerWidth <= MD_BREAKPOINT ? ['100%', '100%'] : ['70%', '80%']

  const photos = useLocations((state) => state.photos);
  const locations = useLocations((state) => state.locations);
  const setPhotos = useLocations((state) => state.setPhotos);

  const [lightboxPhotos, setLightboxPhotos] = useState([]);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [lightboxToggle, setLightboxToggle] = useState(false);

  const dateOptions = {
    day: 'numeric',
    year: 'numeric',
    month: 'short'
  }

  // everytime photos change, set the display slides
  useEffect(() => {
    setLightboxPhotos(
      photos.map((p) => ({
        src: BUCKET_URL + p.display_image_path,
        alt: p.caption,
        title: locations?.find((loc) => loc.id == p.location_id)?.name + ' - ' + (new Date(p.date_taken)).toLocaleDateString(dateOptions),
        description: p.caption,
      }))
    );
  }, [photos]);

  // group the photos by location
  const photosByLocations = useMemo(() => {
    // turn photos into a map of locationId keys -> photo values
    const locToPhotosMap = photos.reduce((map, photo, photoIndex) => {
      const key = photo.location_id;
      photo['originalIndex'] = photoIndex; // set index for use later

      // add locationID as key if not already
      if (!map[key]) map[key] = [];

      map[key].push(photo);
      return map;
    }, {});

    // sort photos within each group (newest first), and compute latest date per group
    const sections = Object.entries(locToPhotosMap).map(([locationID, groupPhotos]) => {
      return {
        locationID,
        locationName: locations?.find((loc) => loc.id == locationID)?.name,
        photos: groupPhotos,
        latestDate: Math.max(...groupPhotos.map((photo) => new Date(photo.date_taken))),
      };
    });

    // order sections by their latest photo, newest first
    sections.sort((a, b) => new Date(b.latestDate) - new Date(a.latestDate));

    // return photo sections that are sorted by photo descending
    return sections;
  }, [photos]);

  // sets the current photo for the lightbox
  function setLightboxPhoto(i) {
    setCurrentPhoto(i);
    setLightboxToggle(true);
  }

  // delete image from s3 buckets and remove from photos
  async function deleteImage(i) {
    if (!isAdmin) return;

    const photo = photos[i];
    if (!photo) return;

    const paths = [
      photo.display_image_path,
      photo.medium_image_path,
      photo.thumbnail_image_path,
    ];

    await deletePhotoRow(photo.id);

    await deleteFileFromSupabase(paths);

    // remove photo from array
    setPhotos(photos.filter((_, index) => index !== i));
  }

  return (
    <>
      <Lightbox
        plugins={[Captions]}
        open={lightboxToggle}
        close={() => setLightboxToggle(false)}
        index={currentPhoto}
        slides={lightboxPhotos}
      />
      <Dialog isOpen={isOpen} onClose={onClose} width={photoGridWidth} height={photoGridHeight}>
        <div className="flex w-full mb-2">
          <span className={photosByLocations.length > 1 ? 'text-xl' : 'text-2xl'}> {name} Photos </span>
          <button className="w-7 h-7 ml-auto" onClick={onClose}>
            <CloseIcon/>
          </button>
        </div>

        {/* flex-1 fills remaining dialog height; overflow-y-auto enables scrolling when photos exceed it */}
        <div className="flex-1 overflow-y-auto">
          {/* flex-wrap rows where every image shares the same fixed height; w-auto preserves aspect ratio */}
          {!isLoading ? (
            <>
              { photos.length > 0 ? (
                photosByLocations.map((l) => (
                  <div className="pl-2 mb-9">
                    { photosByLocations.length > 1 && <span className="text-2xl tracking-wide font-medium">{l.locationName}</span> }
                    <div className="pt-4 lg:flex lg:flex-wrap lg:gap-2 gap-1 justify-center grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
                      { l.photos.map((photo, i) => (
                        <div className="rounded lg:aspect-auto aspect-square md:hover:scale-102 md:hover:shadow-md md:hover:shadow-gray-600 md:hover:z-10 relative group">
                          {isAdmin && (
                            <button
                              onClick={() => deleteImage(i)}
                              className="absolute m-1 top-0 right-0 bg-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-40"
                            >
                              <CloseIcon sx={{ fontSize: 12 }} />
                            </button>
                          )}
                          {
                            l.photos.length > 2 ? (
                              <img
                                key={i}
                                loading="lazy"
                                src={BUCKET_URL + photo.medium_image_path}
                                className="lg:h-50 lg:w-auto h-full w-full object-cover rounded cursor-pointer transition-transform duration-200  relative"
                                onClick={() => setLightboxPhoto(photo.originalIndex)}
                              />
                            ) : 
                            (
                              <img
                                key={i}
                                loading="lazy"
                                src={BUCKET_URL + photo.medium_image_path}
                                className="lg:h-70 h-full w-full object-cover rounded cursor-pointer transition-transform duration-200  relative"
                                onClick={() => setLightboxPhoto(photo.originalIndex)}
                              />
                            )
                          }
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : 
              (
                <div className="flex grow h-full justify-center items-center"> No Photos Yet </div>
              )
              }
            </>
          ) :
          (
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}

export default PhotoCarousel;
