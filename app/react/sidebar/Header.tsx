import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';

import { isBE, isSrvFix } from '@/react/portainer/feature-flags/feature-flags.service';

import { Link } from '@@/Link';

import fullLogoBE from './portainer_logo-BE.svg';
import fullLogoCE from './portainer_logo-CE.svg';
import smallLogoBE from './logomark-BE.svg';
import smallLogoCE from './logomark-CE.svg';
import { useSidebarState } from './useSidebarState';
import styles from './Header.module.css';

interface Props {
  logo?: string;
}

export function Header({ logo: customLogo }: Props) {
  const { toggle, isOpen } = useSidebarState();

  return (
    <div className="flex">
      <div
        className={clsx('pr-5 w-full flex flex-wrap', {
          'justify-center': !isOpen,
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
              {isBE || isSrvFix ? (
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
          'flex h-6 w-6 items-center justify-center rounded border-0',
          'transition-all duration-200',
          'text-sm text-gray-4',
          'bg-graphite-900 hover:bg-graphite-500',
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
    return isBE || isSrvFix ? smallLogoBE : smallLogoCE;
  }

  return isBE || isSrvFix ? fullLogoBE : fullLogoCE;
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
