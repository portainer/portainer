import { PropsWithChildren } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuLink as ReachMenuLink,
} from '@reach/menu-button';
import clsx from 'clsx';
import { User, ChevronDown } from 'react-feather';
import { useSref } from '@uirouter/react';

import { useUser } from '@/portainer/hooks/useUser';

import { useHeaderContext } from './HeaderContainer';
import styles from './HeaderTitle.module.css';

interface Props {
  title: string;
}

export function HeaderTitle({ title, children }: PropsWithChildren<Props>) {
  useHeaderContext();
  const { user } = useUser();

  return (
    <div className="page white-space-normal">
      {title}
      <span className="header_title_content">{children}</span>
      <Menu>
        <MenuButton className={clsx('pull-right', styles.menuButton)}>
          <User className="icon-nested-gray" />
          {user && <span>{user.Username}</span>}
          <ChevronDown className={styles.arrowDown} />
        </MenuButton>

        <MenuList className={styles.menuList}>
          {!window.ddExtension && (
            <MenuLink to="portainer.account" label="My account" />
          )}

          <MenuLink to="portainer.logout" label="Log out" />
        </MenuList>
      </Menu>
    </div>
  );
}

interface MenuLinkProps {
  to: string;
  label: string;
}

function MenuLink({ to, label }: MenuLinkProps) {
  const anchorProps = useSref(to);

  return (
    <ReachMenuLink
      href={anchorProps.href}
      onClick={anchorProps.onClick}
      className={styles.menuLink}
    >
      {label}
    </ReachMenuLink>
  );
}
