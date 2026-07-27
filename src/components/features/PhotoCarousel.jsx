import { useState, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from "yet-another-react-lightbox/plugins/captions";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
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
        title: (new Date(p.date_taken)).toLocaleDateString(dateOptions),
        description: p.caption,
      }))
    );
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
        <div className="flex w-full mb-3 place-content-between">
          <span className="text-2xl font-medium"> {name} Photos </span>
          <button className="w-7 h-7" onClick={onClose}>
            <CloseIcon/>
          </button>
        </div>

        {/* flex-1 fills remaining dialog height; overflow-y-auto enables scrolling when photos exceed it */}
        <div className="flex-1 overflow-y-auto">
          {/* flex-wrap rows where every image shares the same fixed height; w-auto preserves aspect ratio */}
          {!isLoading ? (
            <>
              { photos.length > 0 ? (
                  <div className="py-2 lg:flex lg:flex-wrap lg:gap-2 gap-1 justify-center grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
                    {photos.map((photo, i) => (
                      <div className="rounded lg:aspect-auto aspect-square md:hover:scale-102 md:hover:shadow-md md:hover:shadow-gray-600 md:hover:z-10 relative group">
                        {isAdmin && (
                          <button
                            onClick={() => deleteImage(i)}
                            className="absolute m-1 top-0 right-0 bg-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity z-40"
                          >
                            <CloseIcon sx={{ fontSize: 12 }} />
                          </button>
                        )}
                        <img
                          key={i}
                          loading="lazy"
                          src={BUCKET_URL + photo.medium_image_path}
                          className="lg:h-40 lg:w-auto h-full w-full object-cover rounded cursor-pointer transition-transform duration-200  relative"
                          onClick={() => setLightboxPhoto(i)}
                        />
                      </div>
                    ))}
                  </div>
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
