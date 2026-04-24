import { type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { MouseEventHandler, PropsWithChildren } from 'react';

import { AutomationTestingProps } from '@/types';

import { Icon } from '@@/Icon';
import { Badge } from '@@/Badge';

import { useSidebarState } from '../useSidebarState';

import { Wrapper } from './Wrapper';
import { SidebarTooltip } from './SidebarTooltip';
import { useSidebarSrefActive } from './useSidebarSrefActive';

interface Props extends AutomationTestingProps {
  icon?: LucideIcon;
  to: string;
  params?: object;
  label: string;
  isSubMenu?: boolean;
  ignorePaths?: string[];
  includePaths?: string[];
  count?: number;
}

export function SidebarItem({
  icon,
  to,
  params,
  label,
  isSubMenu = false,
  ignorePaths = [],
  includePaths = [],
  count,
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
        count={count}
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
        <div className="rounded th-highcontrast:border th-highcontrast:border-solid th-highcontrast:border-white th-highcontrast:bg-black">
          <Wrapper label={label}>
            <ItemAnchor
              href={anchorProps.href}
              onClick={anchorProps.onClick}
              className={anchorProps.className}
              dataCy={dataCy}
              isOpen={isOpen}
              isSubMenu={isSubMenu}
              count={count}
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
  count?: number;
};

function ItemAnchor({
  href,
  onClick,
  className,
  isOpen,
  isSubMenu,
  dataCy,
  count,
  children,
}: PropsWithChildren<ItemAnchorProps>) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={clsx(
        className,
        '!text-inherit no-underline hover:!text-inherit hover:!no-underline focus:!text-inherit focus:!no-underline',
        'flex h-8 w-full flex-1 items-center space-x-4 rounded-md text-sm',
        'transition-colors duration-200 hover:bg-graphite-500',
        {
          // submenu items are always expanded (in a tooltip or in the sidebar)
          'w-full justify-start px-3': isOpen || isSubMenu,
          'w-8 justify-center': !isOpen && !isSubMenu,
        }
      )}
      data-cy={dataCy}
    >
      {children}
      {(isOpen || isSubMenu) && count !== undefined && count > 0 && (
        // 99 is for a conventional badge overflow cap, same pattern as GitHub/Slack notification badges
        <Badge type="info">{count > 99 ? '99+' : count}</Badge>
      )}
    </a>
  );
}
