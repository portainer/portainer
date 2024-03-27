import { Icon as IconTest } from 'lucide-react';
import clsx from 'clsx';
import { MouseEventHandler, PropsWithChildren } from 'react';

import { AutomationTestingProps } from '@/types';

import { Icon } from '@@/Icon';

import { useSidebarState } from '../useSidebarState';

import { Wrapper } from './Wrapper';
import { SidebarTooltip } from './SidebarTooltip';
import { useSidebarSrefActive } from './useSidebarSrefActive';

interface Props extends AutomationTestingProps {
  icon?: IconTest;
  to: string;
  params?: object;
  label: string;
  isSubMenu?: boolean;
  ignorePaths?: string[];
  includePaths?: string[];
}

export function SidebarItem({
  icon,
  to,
  params,
  label,
  isSubMenu = false,
  ignorePaths = [],
  includePaths = [],
  'data-cy': dataCy,
}: Props) {
  const { isOpen } = useSidebarState();
  const anchorProps = useSidebarSrefActive(to, undefined, params, undefined, {
    ignorePaths,
    includePaths,
  });

  const sidebarAnchor = (
    <Wrapper label={label}>
      <ItemAnchor
        href={anchorProps.href}
        onClick={anchorProps.onClick}
        className={anchorProps.className}
        dataCy={dataCy}
        isOpen={isOpen}
        isSubMenu={isSubMenu}
      >
        {!!icon && <Icon icon={icon} className={clsx('flex [&>svg]:w-4')} />}
        {(isOpen || isSubMenu) && <span>{label}</span>}
      </ItemAnchor>
    </Wrapper>
  );

  if (isOpen || isSubMenu) return sidebarAnchor;

  return (
    <SidebarTooltip
      content={
        <div className="rounded bg-blue-8 be:bg-gray-8 th-highcontrast:border th-highcontrast:border-solid th-highcontrast:border-white th-highcontrast:bg-black th-dark:bg-gray-true-8">
          <Wrapper label={label}>
            <ItemAnchor
              href={anchorProps.href}
              onClick={anchorProps.onClick}
              className={anchorProps.className}
              dataCy={dataCy}
              isOpen={isOpen}
              isSubMenu={isSubMenu}
            >
              <span className="px-3">{label}</span>
            </ItemAnchor>
          </Wrapper>
        </div>
      }
    >
      <span className="w-full">{sidebarAnchor}</span>
    </SidebarTooltip>
  );
}

type ItemAnchorProps = {
  href?: string;
  onClick: MouseEventHandler<unknown>;
  className: string;
  isOpen: boolean;
  isSubMenu: boolean;
  dataCy: string;
};

function ItemAnchor({
  href,
  onClick,
  className,
  isOpen,
  isSubMenu,
  dataCy,
  children,
}: PropsWithChildren<ItemAnchorProps>) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={clsx(
        className,
        'text-inherit no-underline hover:text-inherit hover:no-underline focus:text-inherit focus:no-underline',
        'flex h-8 w-full flex-1 items-center space-x-4 rounded-md text-sm',
        'transition-colors duration-200 hover:bg-blue-5/20 be:hover:bg-gray-5/20 th-dark:hover:bg-gray-true-5/20',
        {
          // submenu items are always expanded (in a tooltip or in the sidebar)
          'w-full justify-start px-3': isOpen || isSubMenu,
          'w-8 justify-center': !isOpen && !isSubMenu,
        }
      )}
      data-cy={dataCy}
    >
      {children}
    </a>
  );
}
