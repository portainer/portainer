import { ComponentProps } from 'react';
import clsx from 'clsx';

import { Button } from '@@/buttons';

type Props = Omit<ComponentProps<typeof Button>, 'color' | 'size'>;

export function ActionBarButton({ className, ...props }: Props) {
  return (
    <Button
      color="none"
      size="small"
      className={clsx(
        'rounded-md !px-3 !py-1.5 transition-colors',
        'hover:bg-[var(--bg-blocklist-hover-color)] hover:text-[var(--text-blocklist-hover-color)]',
        className
      )}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}
