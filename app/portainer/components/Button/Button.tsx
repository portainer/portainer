import { PropsWithChildren } from 'react';
import clsx from 'clsx';

type Type = 'submit' | 'reset' | 'button';
type Color = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'link';
type Size = 'xsmall' | 'small' | 'medium' | 'large';
export interface Props {
  type?: Type;
  color?: Color;
  size?: Size;
  disabled?: boolean;
  title?: string;
  className?: string;
  onClick: () => void;
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
}: PropsWithChildren<Props>) {
  return (
    <button
      /* eslint-disable-next-line react/button-has-type */
      type={type}
      disabled={disabled}
      className={clsx('btn', `btn-${color}`, sizeClass(size), className)}
      onClick={onClick}
      title={title}
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
