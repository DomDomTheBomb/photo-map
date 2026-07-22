import { useState } from 'react';

import Map from '../components/map/Map';
import AddPhotoButton from '../components/ui/AddPhotoButton';
import PhotoPicker from '../components/features/PhotoPicker';

export default function MainView(){
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  return (
    <>
      <div>
        <AddPhotoButton
          onClick={() => {
            setShowPhotoPicker(true);
          }}
        />
        <PhotoPicker
          isOpen={showPhotoPicker}
          onClose={() => {
            setShowPhotoPicker(false);
          }}
        />
        <Map />
      </div>
    </>
  );
}