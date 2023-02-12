import clsx from 'clsx';
import { ComponentProps } from 'react';

import { Button } from './buttons';
import { Link } from './Link';

export function LinkButton({
  to,
  params,
  disabled,
  className,
  children,
  title = '',
  ...props
}: ComponentProps<typeof Button> & ComponentProps<typeof Link>) {
  return (
    <Button
      title={title}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={clsx(className, 'no-link !m-0')}
      disabled={disabled}
      as={disabled ? 'span' : Link}
      props={{
        to,
        params,
      }}
    >
      {children}
    </Button>
  );
}
