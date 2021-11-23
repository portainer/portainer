import { PropsWithChildren } from 'react';
import clsx from 'clsx';

type Type = 'submit' | 'reset' | 'button';
type Color = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'link';
type Size = 'xsmall' | 'small' | 'large';
export interface Props {
  type?: Type;
  color?: Color;
  size?: Size;
  disabled?: boolean;
  onClick: () => void;
}

export function Button({
  type = 'button',
  color = 'primary',
  size = 'small',
  disabled = false,
  onClick,
  children,
}: PropsWithChildren<Props>) {
  return (
    <button
      /* eslint-disable-next-line react/button-has-type */
      type={type}
      disabled={disabled}
      className={clsx('btn', `btn-${color}`, sizeClass(size))}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function sizeClass(size?: Size) {
  switch (size) {
    case 'large':
      return 'btn-lg';
    case 'xsmall':
      return 'btn-xs';
    default:
      return 'btn-sm';
  }
}
