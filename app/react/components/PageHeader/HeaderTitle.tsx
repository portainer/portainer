import { PropsWithChildren } from 'react';

import { ContextHelp } from '@@/PageHeader/ContextHelp';

import { useHeaderContext } from './HeaderContainer';
import { NotificationsMenu } from './NotificationsMenu';
import { UserMenu } from './UserMenu';

interface Props {
  title: string;
}

export function HeaderTitle({ title, children }: PropsWithChildren<Props>) {
  useHeaderContext();

  return (
    <div className="flex justify-between whitespace-normal pt-3">
      <div className="flex items-center gap-2">
        <h1
          className="m-0 text-2xl font-medium text-gray-11 th-highcontrast:text-white th-dark:text-white"
          data-cy="page-title"
        >
          {title}
        </h1>
        {children && <>{children}</>}
      </div>
      <div className="flex items-end">
        <NotificationsMenu />
        <ContextHelp />
        {!window.ddExtension && <UserMenu />}
      </div>
    </div>
  );
}
