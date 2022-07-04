import { AriaAttributes, MouseEventHandler, PropsWithChildren } from 'react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

type Type = 'submit' | 'button' | 'reset';
type Color =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'link'
  | 'light'
  | 'dangerlight';
type Size = 'xsmall' | 'small' | 'medium' | 'large';

export interface Props extends AriaAttributes, AutomationTestingProps {
  color?: Color;
  size?: Size;
  disabled?: boolean;
  title?: string;
  className?: string;
  type?: Type;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function Button({
  type = 'button',
  color = 'primary',
  size = 'small',
  disabled = false,
  className,
  onClick,
  title,
  children,
  ...ariaProps
}: PropsWithChildren<Props>) {
  return (
    <button
      /* eslint-disable-next-line react/button-has-type */
      type={type}
      disabled={disabled}
      className={clsx('btn', `btn-${color}`, sizeClass(size), className)}
      onClick={onClick}
      title={title}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...ariaProps}
    >
      {children}
    </button>
  );
}

function sizeClass(size?: Size) {
  switch (size) {
    case 'large':
      return 'btn-lg';
    case 'medium':
      return 'btn-md';
    case 'xsmall':
      return 'btn-xs';
    default:
      return 'btn-sm';
  }
}
