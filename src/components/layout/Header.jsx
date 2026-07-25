import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useAuth } from '../../context/AuthContext';

import LogoutIcon from '@mui/icons-material/Logout';

function Header() {
  const isAdmin = useIsAdmin();
  const { signOut } = useAuth();

  return (
    <div className="h-15 px-6 flex items-center bg-primary justify-between">
      <h1 className="text-3xl text-gray-200 font-bold font-[Century Gothic]">
        {' '}
        Where The F*ck Have I Been?{' '}
      </h1>

      {isAdmin && (<LogoutIcon className="text-white cursor-pointer" onClick={signOut}/>)}
    </div>
  );
}

export default Header;
