import { useState, useEffect } from 'react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import Dialog from '../ui/Dialog'
import Spinner from '../ui/spinner/spinner';

import useLocations from '../../store/locations';

const BUCKET_URL = `${import.meta.env.VITE_SUPABASE_URL}storage/v1/object/public/Travel Photos/`

function PhotoCarousel({isOpen = false, onClose, isLoading = false}) {
  const photos = useLocations((state) => state.photos);

  const [lightboxPhotos, setLightboxPhotos] = useState([])
  const [currentPhoto, setCurrentPhoto] = useState(0)
  const [lightboxToggle, setLightboxToggle] = useState(false)

  // everytime photos change, set the display slides
  useEffect(() => {
    setLightboxPhotos(photos.map((p) => ({
      src: BUCKET_URL + p.display_image_path,
      alt: p.caption
    })))
  }, [photos])

  // sets the current photo for the lightbox 
  function setLightboxPhoto(i) {
    setCurrentPhoto(i)
    setLightboxToggle(true)
  }

  return(
    <>
      <Lightbox
        open={lightboxToggle}
        close={() => setLightboxToggle(false)}
        index={currentPhoto}
        slides={lightboxPhotos}
      />
      <Dialog isOpen={isOpen} onClose={onClose} width="60%" height='80%'>
        <div className="mb-3">
          <span className="text-2xl font-medium"> Photos </span>
        </div>

        {/* flex-1 fills remaining dialog height; overflow-y-auto enables scrolling when photos exceed it */}
        <div className="flex-1 overflow-y-auto">
          {/* flex-wrap rows where every image shares the same fixed height; w-auto preserves aspect ratio */}
          { !isLoading ? (
              <div className="py-2 flex flex-wrap gap-2 justify-center">
                {photos.map((photo, i) => (
                  <img
                    key={i}
                    loading="lazy"
                    src={BUCKET_URL + photo.medium_image_path}
                    className="h-40 w-auto rounded cursor-pointer transition-transform duration-200 hover:scale-102 hover:shadow-md hover:shadow-gray-600 hover:z-10 relative"
                    onClick={() => setLightboxPhoto(i)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full">
                <Spinner />
              </div>
            )
          }
        </div>
      </Dialog>
    </>
  )
}

export default PhotoCarousel