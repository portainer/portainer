import {
  AriaAttributes,
  ComponentType,
  MouseEventHandler,
  PropsWithChildren,
  ReactNode,
} from 'react';
import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

import { Icon } from '@@/Icon';
import './Button.css';

type Type = 'submit' | 'button' | 'reset';
type Color =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'link'
  | 'light'
  | 'dangerlight'
  | 'warninglight'
  | 'warning'
  | 'none';
type Size = 'xsmall' | 'small' | 'medium' | 'large';

export interface Props<TasProps = unknown>
  extends AriaAttributes,
    AutomationTestingProps {
  icon?: ReactNode | ComponentType<unknown>;

  color?: Color;
  size?: Size;
  disabled?: boolean;
  title?: string;
  className?: string;
  type?: Type;
  as?: ComponentType<TasProps> | string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  props?: TasProps;
}

export function Button<TasProps = unknown>({
  type = 'button',
  color = 'primary',
  size = 'small',
  disabled = false,
  className,
  onClick,
  title,
  icon,
  children,
  as = 'button',
  props,
  ...ariaProps
}: PropsWithChildren<Props<TasProps>>) {
  const Component = as as 'button';
  return (
    <Component
      /* eslint-disable-next-line react/button-has-type */
      type={type}
      disabled={disabled}
      className={clsx(`btn btn-${color}`, sizeClass(size), className)}
      onClick={(e) => {
        if (!disabled) {
          onClick?.(e);
        }
      }}
      title={title}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...ariaProps}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      {icon && <Icon icon={icon} size={getIconSize(size)} />}
      {children}
    </Component>
  );
}

function getIconSize(size: Size) {
  switch (size) {
    case 'xsmall':
      return 'xs';
    case 'medium':
      return 'md';
    case 'large':
      return 'lg';
    case 'small':
    default:
      return 'sm';
  }
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
