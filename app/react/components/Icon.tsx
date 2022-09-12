import clsx from 'clsx';
import { ComponentType, ReactNode } from 'react';
import * as featherIcons from 'react-feather';
import { isValidElementType } from 'react-is';

import Svg, { SvgIcons } from './Svg';

export interface IconProps {
  icon: ReactNode | ComponentType<unknown>;
  featherIcon?: boolean;
}

export type IconMode =
  | 'alt'
  | 'primary'
  | 'primary-alt'
  | 'secondary'
  | 'secondary-alt'
  | 'warning'
  | 'warning-alt'
  | 'danger'
  | 'danger-alt'
  | 'success'
  | 'success-alt';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface Props {
  icon: ReactNode | ComponentType<{ size?: string | number }>;
  feather?: boolean;
  className?: string;
  size?: IconSize;
  mode?: IconMode;
}

export function Icon({ icon, feather, className, mode, size }: Props) {
  const classes = clsx(
    className,
    'icon',
    { [`icon-${mode}`]: mode },
    { [`icon-${size}`]: size }
  );

  if (typeof icon !== 'string') {
    const Icon = isValidElementType(icon) ? icon : null;

    return (
      <span className={classes} aria-hidden="true" role="img">
        {Icon == null ? <>{icon}</> : <Icon size="1em" />}
      </span>
    );
  }

  if (icon.indexOf('svg-') === 0) {
    const svgIcon = icon.replace('svg-', '');
    return (
      <Svg
        icon={svgIcon as keyof typeof SvgIcons}
        className={clsx(classes, '!flex')}
      />
    );
  }

  if (feather) {
    const iconName = icon
      .split('-')
      .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
      .join('') as keyof typeof featherIcons;
    const IconComponent = featherIcons[iconName];
    if (!IconComponent) {
      throw new Error(`Feather icon not found: ${iconName}`);
    }
    return <IconComponent className={classes} />;
  }

  return (
    <i
      className={clsx(icon.startsWith('fa-') ? `fa ${icon}` : icon, classes)}
      aria-hidden="true"
      role="img"
    />
  );
}
