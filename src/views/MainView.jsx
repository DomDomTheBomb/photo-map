import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AddLocationIcon from '@mui/icons-material/AddLocation';

import Map from '../components/map/Map';
import AddPhotoButton from '../components/ui/AddPhotoButton';
import PhotoPicker from '../components/features/PhotoPicker';
import LoginForm from '../components/features/LoginForm';
import AddNewLocation from '../components/features/AddNewLocation';

import { useAuth } from '../context/AuthContext';
import { useIsAdmin } from '../hooks/useIsAdmin';

export default function MainView() {
  // grab auth session info
  const { session, isAuthLoading, signOut } = useAuth();

  //determine if we are on the admin page and logged in as valid user
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';
  const isAdmin = useIsAdmin();

  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [showLocationAdd, setShowLocationAdd] = useState(false);

  return (
    <>
      <div>
        {isAdminPage && !isAuthLoading && !session && <LoginForm />}

        {/* only display add photo and photo picker if admin */}
        {isAdmin && (
          <div className="flex flex-col absolute z-10">
            <AddPhotoButton
              onClick={() => {
                setShowPhotoPicker(true);
              }}
            />
            <button
              className="h-10 w-10 z-10 bg-white m-3 rounded-full hover:shadow-sm active:brightness-95 transition-opacity"
              onClick={() => setShowLocationAdd(true)}
            >
              <AddLocationIcon className="text-primary" />
            </button>
          </div>
        )}

        {isAdmin && (
          <PhotoPicker
            isOpen={showPhotoPicker}
            onClose={() => {
              setShowPhotoPicker(false);
            }}
          />
        )}

        {isAdmin && (
          <AddNewLocation
            isOpen={showLocationAdd}
            onClose={() => setShowLocationAdd(false)}
          />
        )}
        <Map />
      </div>
    </>
  );
}
