import { ReactNode } from 'react';

import { Wrapper } from './Wrapper';
import { Link } from './Link';
import { Menu } from './Menu';
import { Icon } from './Icon';

type Props = {
  iconClass?: string;
  to: string;
  params?: object;
  label: string;
  children?: ReactNode;
  openOnPaths?: string[];
};

export function SidebarItem({
  children,
  iconClass,
  to,
  params,
  label,
  openOnPaths,
}: Props) {
  const head = (
    <Link to={to} params={params}>
      {label}
      {iconClass && <Icon iconClass={iconClass} />}
    </Link>
  );

  return (
    <Wrapper label={label}>
      {children ? (
        <Menu head={head} openOnPaths={openOnPaths}>
          {children}
        </Menu>
      ) : (
        head
      )}
    </Wrapper>
  );
}
