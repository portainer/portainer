import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { UISrefActive } from '@uirouter/react';

import { Link } from '@/portainer/components/Link';

import '../sidebar.css';
import styles from './SidebarMenuItem.module.css';

interface Props {
  path: string;
  pathParams: object;
  iconClass?: string;
  className: string;
  itemName: string;
}

export function SidebarMenuItem({
  path,
  pathParams,
  iconClass,
  className,
  itemName,
  children,
}: PropsWithChildren<Props>) {
  return (
    <li
      className={clsx('sidebar-menu-item', styles.sidebarMenuItem, className)}
      aria-label={itemName}
    >
      <UISrefActive class="active">
        <Link to={path} params={pathParams} title={itemName}>
          {children}
          {iconClass && (
            <i
              className={clsx('menu-icon fa', iconClass)}
              aria-label="itemIcon"
            />
          )}
        </Link>
      </UISrefActive>
    </li>
  );
}
