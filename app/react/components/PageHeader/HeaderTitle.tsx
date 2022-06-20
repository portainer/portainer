import { PropsWithChildren } from 'react';

import { useUser } from '@/portainer/hooks/useUser';

import { useHeaderContext } from './HeaderContainer';

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
      {user && !window.ddExtension && (
        <span className="pull-right user-box">
          <i className="fa fa-user-circle" aria-hidden="true" />
          {user.Username}
        </span>
      )}
    </div>
  );
}
