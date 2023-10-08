import clsx from 'clsx';
import { ComponentType, ReactNode } from 'react';
import * as lucideIcons from 'lucide-react';
import { isValidElementType } from 'react-is';

import Svg, { SvgIcons } from './Svg';

export interface IconProps {
  icon: ReactNode | ComponentType<unknown>;
  iconClass?: string;
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
  className?: string;
  size?: IconSize;
  mode?: IconMode;
  spin?: boolean;
}

export function Icon({ icon, className, mode, size, spin }: Props) {
  const classes = clsx(className, 'icon inline-flex', {
    [`icon-${mode}`]: mode,
    [`icon-${size}`]: size,
    'animate-spin-slow': spin,
  });

  if (typeof icon !== 'string') {
    const Icon = isValidElementType(icon) ? icon : null;

    if (Icon) {
      return <Icon className={classes} aria-hidden="true" role="img" />;
    }

    return (
      <span className={classes} aria-hidden="true" role="img">
        {icon}
      </span>
    );
  }

  if (icon.indexOf('svg-') === 0) {
    const svgIcon = icon.replace('svg-', '');
    return (
      <Svg
        icon={svgIcon as keyof typeof SvgIcons}
        className={classes}
        aria-hidden="true"
      />
    );
  }

  const iconName = icon
    .split('-')
    .map((s) => s.slice(0, 1).toUpperCase() + s.slice(1))
    .join('') as keyof typeof lucideIcons;
  const IconComponent = lucideIcons[iconName] as React.FC<
    React.SVGProps<SVGSVGElement>
  >;
  if (!IconComponent) {
    // console error so that the error is logged but no functionality is broken
    // eslint-disable-next-line no-console
    console.error(`Icon not found: '${icon}'`);
    return null;
  }

  return <IconComponent className={classes} aria-hidden="true" />;
}
