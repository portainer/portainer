import { PropsWithChildren } from 'react';

import { ContextHelp } from '@@/PageHeader/ContextHelp';

import { useHeaderContext } from './HeaderContainer';
import { UserMenu } from './UserMenu';

interface Props {
  title: string;
}

export function HeaderTitle({ title, children }: PropsWithChildren<Props>) {
  useHeaderContext();

  return (
    <div className="flex justify-between whitespace-normal pt-3">
      <div className="flex items-center gap-2">
        <div className="font-medium text-2xl text-gray-11 th-dark:text-white th-highcontrast:text-white">
          {title}
        </div>
        {children && <span>{children}</span>}
      </div>
      <div className="flex items-center gap-4">
        <ContextHelp />
        {!window.ddExtension && <UserMenu />}
      </div>
    </div>
  );
}
