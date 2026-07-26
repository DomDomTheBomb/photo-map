import { useIsAdmin } from "../../hooks/useIsAdmin";
import { useAuth } from '../../context/AuthContext';

import LogoutIcon from '@mui/icons-material/Logout';

function Header() {
  const isAdmin = useIsAdmin();
  const { signOut } = useAuth();

  return (
    <div className="md:h-15 h-12 md:px-6 px-3 flex items-center bg-primary justify-between">
      <h1 className="md:text-3xl text-xl text-gray-200 font-bold font-[Century Gothic]">
        Where The F*ck Has Dom Been?
      </h1>

      {isAdmin && (<LogoutIcon className="text-white cursor-pointer" onClick={signOut}/>)}
    </div>
  );
}

export default Header;
