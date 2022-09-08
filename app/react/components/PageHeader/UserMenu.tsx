import {
  Menu,
  MenuButton,
  MenuList,
  MenuLink as ReachMenuLink,
} from '@reach/menu-button';
import { UISrefProps, useSref } from '@uirouter/react';
import clsx from 'clsx';
import { User, ChevronDown } from 'react-feather';

import { AutomationTestingProps } from '@/types';
import { useUser } from '@/portainer/hooks/useUser';

import styles from './HeaderTitle.module.css';

export function UserMenu() {
  const { user } = useUser();

  return (
    <Menu>
      <MenuButton
        className={clsx(
          'ml-auto flex items-center gap-1 self-start',
          styles.menuButton
        )}
        data-cy="userMenu-button"
        aria-label="User menu toggle"
      >
        <div
          className={clsx(
            styles.menuIcon,
            'icon-badge text-lg !p-2 mr-1',
            'text-gray-8',
            'th-dark:text-gray-warm-7'
          )}
        >
          <User className="feather" />
        </div>
        {user && <span>{user.Username}</span>}
        <ChevronDown className={styles.arrowDown} />
      </MenuButton>

      <MenuList
        className={styles.menuList}
        aria-label="User Menu"
        data-cy="userMenu"
      >
        <MenuLink
          to="portainer.account"
          label="My account"
          data-cy="userMenu-myAccount"
        />

        <MenuLink
          to="portainer.logout"
          label="Log out"
          data-cy="userMenu-logOut"
          params={{ performApiLogout: true }}
        />
      </MenuList>
    </Menu>
  );
}

interface MenuLinkProps extends AutomationTestingProps, UISrefProps {
  label: string;
}

function MenuLink({
  to,
  label,
  params,
  options,
  'data-cy': dataCy,
}: MenuLinkProps) {
  const anchorProps = useSref(to, params, options);

  return (
    <ReachMenuLink
      href={anchorProps.href}
      onClick={anchorProps.onClick}
      className={styles.menuLink}
      aria-label={label}
      data-cy={dataCy}
    >
      {label}
    </ReachMenuLink>
  );
}
