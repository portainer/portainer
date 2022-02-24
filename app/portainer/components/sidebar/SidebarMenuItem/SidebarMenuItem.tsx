import { PropsWithChildren } from 'react';
import clsx from 'clsx';
import { UISrefActive } from '@uirouter/react';

import { Link } from '@/portainer/components/Link';

import styles from './SidebarMenuItem.module.css';

interface Props {
  path: string;
  pathParams: object;
  iconClass?: string;
  className: string;
}

export function SidebarMenuItem({
  path,
  pathParams,
  iconClass,
  className,
  children,
}: PropsWithChildren<Props>) {
  return (
    <li
      className={clsx('sidebar-menu-item', styles.sidebarMenuItem, className)}
    >
      <UISrefActive class="active">
        <Link to={path} params={pathParams}>
          {children}
          {iconClass && <span className={clsx('menu-icon fa', iconClass)} />}
        </Link>
      </UISrefActive>
    </li>
  );
}
