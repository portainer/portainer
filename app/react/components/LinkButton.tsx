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
  ...props
}: ComponentProps<typeof Button> & ComponentProps<typeof Link>) {
  return (
    <Button
      size="medium"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={clsx(className, '!m-0 no-link')}
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
