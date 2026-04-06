import {
  Menu,
  MenuButton,
  MenuList,
  MenuLink as ReachMenuLink,
} from '@reach/menu-button';
import { UISrefProps, useSref } from '@uirouter/react';
import clsx from 'clsx';
import { User, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { queryClient } from '@/react-tools/react-query';
import { AutomationTestingProps } from '@/types';
import { useUser } from '@/react/hooks/useUser';

import styles from './HeaderTitle.module.css';

export function UserMenu() {
  const { t } = useTranslation();
  const { user } = useUser();

  return (
    <Menu>
      <MenuButton
        className={clsx(
          'ml-auto flex items-center gap-1 self-start',
          styles.menuButton
        )}
        data-cy="userMenu-button"
        aria-label={t('user_menu.toggle_label')}
      >
        <div
          className={clsx(
            styles.menuIcon,
            'icon-badge mr-1 !p-2 text-lg',
            'text-gray-8',
            'th-dark:text-gray-warm-7'
          )}
        >
          <User className="lucide" />
        </div>
        {user && <span>{user.Username}</span>}
        <ChevronDown className={styles.arrowDown} />
      </MenuButton>

      <MenuList
        className={styles.menuList}
        aria-label={t('user_menu.menu_label')}
        data-cy="userMenu"
      >
        <MenuLink
          to="portainer.account"
          label={t('user_menu.my_account')}
          data-cy="userMenu-myAccount"
        />

        <MenuLink
          to="portainer.logout"
          label={t('user_menu.log_out')}
          data-cy="userMenu-logOut"
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
      onClick={(e) => {
        queryClient.clear();
        anchorProps.onClick(e);
      }}
      className={styles.menuLink}
      aria-label={label}
      data-cy={dataCy}
    >
      {label}
    </ReachMenuLink>
  );
}
