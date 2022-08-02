import { PropsWithChildren } from 'react';

import { Icon } from '@@/Icon';

export function FormError({ children }: PropsWithChildren<unknown>) {
  return (
    <div className="small text-warning vertical-center">
      <Icon
        icon="alert-triangle"
        feather
        className="icon icon-sm icon-warning"
      />
      {children}
    </div>
  );
}
