import Header from './components/layout/Header';
import Map from './components/map/Map';
import AddPhotoButton from './components/ui/AddPhotoButton';
import PhotoPicker from './components/features/PhotoPicker';

import { useState } from 'react';

export default function App() {
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  // function handleSetShowPhotoPicker(v) {
  //   setShowPhotoPicker(v)
  // }

  return (
    <>
      <Header />
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
