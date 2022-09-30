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
    <div className="flex">
      <div>
        <Link
          to="portainer.home"
          data-cy="portainerSidebar-homeImage"
          className="text-2xl text-white no-underline hover:no-underline hover:text-white focus:no-underline focus:text-white focus:outline-none"
        >
          <Logo customLogo={customLogo} isOpen={isOpen} />
        </Link>
        {isOpen && customLogo && (
          <div
            className={clsx(
              'uppercase text-[9.4px] space-x-1 tracking-[.28em] pt-3',
              'text-gray-3',
              'th-dark:text-gray-warm-6'
            )}
          >
            <span className="font-medium">Powered by</span>
            <span className="font-semibold">
              {isBE ? (
                'portainer business'
              ) : (
                <a
                  href="https://www.portainer.io/install-BE-now"
                  className={clsx(
                    'hover:underline',
                    'text-blue-6 hover:text-blue-8',
                    'th-dark:text-blue-7 th-dark:hover:text-blue-9'
                  )}
                >
                  portainer community
                </a>
              )}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => toggle()}
        className={clsx(
          styles.collapseBtn,
          'w-6 h-6 flex justify-center items-center border-0 rounded',
          'transition-all duration-200',
          'text-sm text-gray-4 be:text-gray-5 hover:text-white be:hover:text-white',
          'bg-blue-11 be:bg-gray-10',
          'th-dark:bg-gray-warm-11',
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
