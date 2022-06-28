import { ReactNode } from 'react';
import { Icon } from 'react-feather';

import { Wrapper } from './Wrapper';
import { Menu } from './Menu';
import { Head } from './Head';
import { getPathsForChildren } from './utils';

interface Props {
  icon?: Icon;
  to: string;
  params?: object;
  label: string;
  children?: ReactNode;
  openOnPaths?: string[];
}

export function SidebarItem({
  children,
  icon,
  to,
  params,
  label,
  openOnPaths = [],
}: Props) {
  const childrenPath = getPathsForChildren(children);
  const head = (
    <Head
      icon={icon}
      to={to}
      params={params}
      label={label}
      ignorePaths={childrenPath}
    />
  );

  return (
    <Wrapper label={label}>
      {children ? (
        <Menu head={head} openOnPaths={[...openOnPaths, ...childrenPath]}>
          {children}
        </Menu>
      ) : (
        head
      )}
    </Wrapper>
  );
}
