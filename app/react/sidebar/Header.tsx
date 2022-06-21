import { ChevronsLeft, ChevronsRight } from 'react-feather';

import defaultLogo from '@/assets/images/logo_small_alt.png';

import { Link } from '@@/Link';

import { useSidebarState } from './useSidebarState';

interface Props {
  logo?: string;
}

export function Header({ logo }: Props) {
  const { toggle, isOpen } = useSidebarState();

  return (
    <div className="flex justify-between items-center">
      <Link
        to="portainer.home"
        data-cy="portainerSidebar-homeImage"
        className="text-2xl text-white no-underline hover:no-underline hover:text-white"
      >
        <img
          src={logo || defaultLogo}
          className="img-responsive logo"
          alt={!logo ? 'portainer.io' : 'Logo'}
        />
        {isOpen && 'portainer.io'}
      </Link>

      <button
        type="button"
        onClick={() => toggle()}
        className="w-6 h-6 flex justify-center items-center text-white border-0 rounded text-sm be:bg-blue-7 bg-blue-8"
        aria-label="Toggle Sidebar"
        title="Toggle Sidebar"
      >
        {isOpen ? <ChevronsLeft /> : <ChevronsRight />}
      </button>
    </div>
  );
}
