import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import Map from '../components/map/Map';
import AddPhotoButton from '../components/ui/AddPhotoButton';
import PhotoPicker from '../components/features/PhotoPicker';
import LoginForm from '../components/features/LoginForm';

import { useAuth } from '../context/AuthContext';

export default function MainView() {
  // grab auth session info
  const { session, isAuthLoading, signOut } = useAuth();

  //determine if we are on the admin page and logged in as valid user
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';
  const isAdmin = isAdminPage && !!session;

  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  return (
    <>
      <div>
        {isAdminPage && !isAuthLoading && !session && <LoginForm />}
        {/* only display add photo and photo picker if admin */}
        {isAdmin && (
          <AddPhotoButton
            onClick={() => {
              setShowPhotoPicker(true);
            }}
          />
        )}
        {isAdmin && (
          <PhotoPicker
            isOpen={showPhotoPicker}
            onClose={() => {
              setShowPhotoPicker(false);
            }}
          />
        )}

        <Map />
      </div>
    </>
  );
}
