import { PropsWithChildren } from 'react';
import { Menu, MenuButton, MenuList, MenuLink } from '@reach/menu-button';
import clsx from 'clsx';
import { User, ChevronDown } from 'react-feather';

import { useUser } from '@/portainer/hooks/useUser';

import { Link } from '@@/Link';

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
          <User className="feather" />
          {user && <span>{user.Username}</span>}
          <ChevronDown className="feather" />
        </MenuButton>
        <MenuList className={styles.menuList}>
          <MenuLink
            className={styles.menuLink}
            as={Link}
            to="portainer.account"
          >
            My account
          </MenuLink>
          <MenuLink className={styles.menuLink} as={Link} to="portainer.logout">
            Log out
          </MenuLink>
        </MenuList>
      </Menu>
    </div>
  );
}
