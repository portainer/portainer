import { MouseEventHandler, PropsWithChildren } from 'react';
import clsx from 'clsx';

type Type = 'submit' | 'button' | 'reset';
type Color = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'link';
type Size = 'xsmall' | 'small' | 'medium' | 'large';

export interface Props {
  color?: Color;
  size?: Size;
  disabled?: boolean;
  title?: string;
  className?: string;
  dataCy?: string;
  type?: Type;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export function Button({
  type = 'button',
  color = 'primary',
  size = 'small',
  disabled = false,
  className,
  dataCy,
  onClick,
  title,
  children,
}: PropsWithChildren<Props>) {
  return (
    <button
      data-cy={dataCy}
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
