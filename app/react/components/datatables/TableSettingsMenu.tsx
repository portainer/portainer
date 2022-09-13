import clsx from 'clsx';
import { Menu, MenuButton, MenuList } from '@reach/menu-button';
import { PropsWithChildren, ReactNode } from 'react';
import { MoreVertical } from 'react-feather';

interface Props {
  quickActions?: ReactNode;
}

export function TableSettingsMenu({
  quickActions,
  children,
}: PropsWithChildren<Props>) {
  return (
    <Menu className="setting">
      {({ isExpanded }) => (
        <>
          <MenuButton
            className={clsx('table-setting-menu-btn', {
              'setting-active': isExpanded,
            })}
          >
            <MoreVertical
              size="13"
              className="space-right"
              strokeWidth="3px"
              aria-hidden="true"
              aria-label="Settings"
            />
          </MenuButton>
          <MenuList>
            <div className="tableMenu">
              <div className="menuHeader">Table settings</div>
              <div className="menuContent">{children}</div>
              {quickActions && (
                <div>
                  <div className="menuHeader">Quick actions</div>
                  <div className="menuContent">{quickActions}</div>
                </div>
              )}
            </div>
          </MenuList>
        </>
      )}
    </Menu>
  );
}
