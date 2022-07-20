import { PropsWithChildren } from 'react';

import { useHeaderContext } from './HeaderContainer';

export function HeaderContent({ children }: PropsWithChildren<unknown>) {
  useHeaderContext();

  return (
    <div className="breadcrumb-links">
      <div className="pull-left">{children}</div>
    </div>
  );
}
