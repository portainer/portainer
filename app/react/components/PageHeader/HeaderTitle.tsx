import { PropsWithChildren } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuLink as ReachMenuLink,
} from '@reach/menu-button';
import clsx from 'clsx';
import { User, ChevronDown } from 'react-feather';
import { UISrefProps, useSref } from '@uirouter/react';

import { useUser } from '@/portainer/hooks/useUser';
import { AutomationTestingProps } from '@/types';

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
        <MenuButton
          className={clsx(
            'pull-right flex items-center gap-1',
            styles.menuButton
          )}
          data-cy="userMenu-button"
          aria-label="User menu toggle"
        >
          <User className="icon-nested-gray" />
          {user && <span>{user.Username}</span>}
          <ChevronDown className={styles.arrowDown} />
        </MenuButton>

        <MenuList
          className={styles.menuList}
          aria-label="User Menu"
          data-cy="userMenu"
        >
          {!window.ddExtension && (
            <MenuLink
              to="portainer.account"
              label="My account"
              data-cy="userMenu-myAccount"
            />
          )}

          <MenuLink
            to="portainer.logout"
            label="Log out"
            data-cy="userMenu-logOut"
            params={{ performApiLogout: true }}
          />
        </MenuList>
      </Menu>
    </div>
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
