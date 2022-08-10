import { ChevronsLeft, ChevronsRight } from 'react-feather';
import clsx from 'clsx';

import { isBE } from '@/portainer/feature-flags/feature-flags.service';
import smallLogo from '@/assets/ico/logomark.svg';

import { Link } from '@@/Link';

import fullLogoBE from './portainer_logo-BE.svg';
import fullLogoCE from './portainer_logo-CE.svg';
import { useSidebarState } from './useSidebarState';
import styles from './Header.module.css';

interface Props {
  logo?: string;
}

export function Header({ logo: customLogo }: Props) {
  const { toggle, isOpen } = useSidebarState();

  return (
    <div className="flex justify-between items-center">
      <Link
        to="portainer.home"
        data-cy="portainerSidebar-homeImage"
        className="text-2xl text-white no-underline hover:no-underline hover:text-white focus:no-underline focus:text-white focus:outline-none"
      >
        <Logo customLogo={customLogo} isOpen={isOpen} />
      </Link>

      <button
        type="button"
        onClick={() => toggle()}
        className={clsx(
          'w-6 h-6 flex justify-center items-center border-0 rounded',
          'transition-all duration-200',
          'text-sm text-gray-4 be:text-gray-5 hover:text-white be:hover:text-white',
          'bg-blue-11 hover:bg-blue-10 be:bg-gray-10 be:hover:bg-gray-8',
          'th-dark:bg-gray-warm-11 hover:th-dark:bg-gray-warm-9',
          'absolute',
          { '-right-[10px]': !isOpen, 'right-6': isOpen }
        )}
        aria-label="Toggle Sidebar"
        title="Toggle Sidebar"
      >
        {isOpen ? <ChevronsLeft /> : <ChevronsRight />}
      </button>
    </div>
  );
}

function getLogo(isOpen: boolean, customLogo?: string) {
  if (customLogo) {
    return customLogo;
  }

  if (!isOpen) {
    return smallLogo;
  }

  return isBE ? fullLogoBE : fullLogoCE;
}

function Logo({
  customLogo,
  isOpen,
}: {
  customLogo?: string;
  isOpen: boolean;
}) {
  const logo = getLogo(isOpen, customLogo);

  return (
    <img
      src={logo}
      className={clsx('img-responsive', styles.logo)}
      alt="Logo"
    />
  );
}
