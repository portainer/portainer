import clsx from 'clsx';

import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Link } from '@@/Link';

import fullLogoBE from './portainer_logo-BE.svg';
import fullLogoCE from './portainer_logo-CE.svg';
import portainerIcon from './portainer-p-icon-white.svg';
import { useSidebarState } from './useSidebarState';
import styles from './Header.module.css';

interface Props {
  logo?: string;
}

export function Header({ logo: customLogo }: Props) {
  const { isOpen } = useSidebarState();

  return (
    <div
      className={clsx('flex w-full flex-wrap', {
        'justify-center pr-5': !isOpen,
      })}
    >
      <Link
        to="portainer.home"
        data-cy="portainerSidebar-homeImage"
        className="text-2xl text-white no-underline hover:text-white hover:no-underline focus:text-white focus:no-underline focus:outline-none"
      >
        <Logo customLogo={customLogo} isOpen={isOpen} />
      </Link>
      {isOpen && customLogo && (
        <div
          className={clsx(
            'space-x-1 pt-3 text-[9.4px] uppercase tracking-[.28em]',
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
  );
}

function getLogo(isOpen: boolean, customLogo?: string) {
  if (customLogo) {
    return customLogo;
  }

  if (!isOpen) {
    return portainerIcon;
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
      className={clsx('img-responsive', styles.logo, {
        '!max-h-[27px]': !isOpen,
      })}
      alt="Logo"
    />
  );
}
