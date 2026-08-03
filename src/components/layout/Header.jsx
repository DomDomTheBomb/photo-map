import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useAuth } from '../../context/AuthContext';

import LogoutIcon from '@mui/icons-material/Logout';

import '@fontsource/quicksand/700.css';

function Header() {
  const isAdmin = useIsAdmin();
  const { signOut } = useAuth();

  return (
    <div className="md:h-15 h-12 md:px-6 px-3 flex items-center bg-primary border-b-3 border-b-secondary justify-between">
      <h1 className="md:text-3xl text-xl text-secondary font-bold font-[quicksand]">
        Where The F*ck Was Dom?
      </h1>

      {isAdmin && (<LogoutIcon className="text-white cursor-pointer" onClick={signOut}/>)}
    </div>
  );
}

export default Header;
