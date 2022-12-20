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
  const button = (
    <Button
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      className={clsx(className, '!m-0', { 'h-full': !disabled })}
      size="medium"
      disabled={disabled}
    >
      {children}
    </Button>
  );

  if (disabled) {
    return button;
  }

  return (
    <Link to={to} params={params} className="text-inherit hover:no-underline">
      {button}
    </Link>
  );
}
