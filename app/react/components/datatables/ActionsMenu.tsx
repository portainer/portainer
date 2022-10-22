import { ReactNode } from 'react';
import clsx from 'clsx';
import { Menu, MenuList, MenuButton } from '@reach/menu-button';

import { Icon } from '@@/Icon';

import styles from './ActionsMenu.module.css';

interface Props {
  children: ReactNode;
}

export function ActionsMenu({ children }: Props) {
  return (
    <Menu className={styles.actions}>
      {({ isExpanded }) => (
        <>
          <MenuButton
            className={clsx(
              styles.tableActionsMenuBtn,
              isExpanded && styles.actionsActive
            )}
          >
            <Icon icon="more-vertical" />
          </MenuButton>
          <MenuList>
            <div className={styles.tableActionsMenuList}>{children}</div>
          </MenuList>
        </>
      )}
    </Menu>
  );
}
