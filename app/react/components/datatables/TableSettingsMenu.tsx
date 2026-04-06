import clsx from 'clsx';
import { Menu, MenuButton, MenuList } from '@reach/menu-button';
import { PropsWithChildren, ReactNode } from 'react';
import { MoreVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  quickActions?: ReactNode;
}

export function TableSettingsMenu({
  quickActions,
  children,
}: PropsWithChildren<Props>) {
  const { t } = useTranslation();
  return (
    <Menu className="setting">
      {({ isExpanded }) => (
        <>
          <MenuButton
            className={clsx('table-setting-menu-btn', {
              'setting-active': isExpanded,
            })}
            aria-label={t('common.settings')}
            title={t('common.settings')}
          >
            <MoreVertical
              size="13"
              className="space-right"
              strokeWidth="3px"
              aria-hidden="true"
            />
          </MenuButton>
          <MenuList>
            <div className="tableMenu">
              <div className="menuHeader">{t('common.table_settings')}</div>
              <div className="menuContent">{children}</div>
              {quickActions && (
                <div>
                  <div className="menuHeader">{t('common.quick_actions')}</div>
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
