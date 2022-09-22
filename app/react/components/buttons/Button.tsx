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
  | 'none';
type Size = 'xsmall' | 'small' | 'medium' | 'large';

export interface Props extends AriaAttributes, AutomationTestingProps {
  icon?: ReactNode | ComponentType<unknown>;
  featherIcon?: boolean;

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
  icon,
  featherIcon,
  children,

  ...ariaProps
}: PropsWithChildren<Props>) {
  return (
    <button
      /* eslint-disable-next-line react/button-has-type */
      type={type}
      disabled={disabled}
      className={clsx(`btn btn-${color}`, sizeClass(size), className)}
      onClick={onClick}
      title={title}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...ariaProps}
    >
      {icon && (
        <Icon
          icon={icon}
          size={getIconSize(size)}
          className="inline-flex"
          feather={featherIcon}
        />
      )}
      {children}
    </button>
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
