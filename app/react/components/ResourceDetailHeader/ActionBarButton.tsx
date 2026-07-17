import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { Button, ButtonProps } from '@@/buttons';

type Props<TasProps> = Omit<ButtonProps<TasProps>, 'size'>;

export function ActionBarButton<TasProps = unknown>({
  className,
  color = 'none',
  ...props
}: PropsWithChildren<Props<TasProps>>) {
  return (
    <Button<TasProps>
      color={color}
      size="small"
      className={clsx(
        '!ml-0 rounded-md !px-3 !py-1.5 transition-colors',
        'hover:bg-[var(--bg-blocklist-hover-color)] hover:text-[var(--text-blocklist-hover-color)]',
        className
      )}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  );
}
