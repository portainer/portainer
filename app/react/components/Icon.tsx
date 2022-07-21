import clsx from 'clsx';
import { ComponentType, ReactNode, useEffect } from 'react';
import featherIcons from 'feather-icons';
import { isValidElementType } from 'react-is';

import Svg, { SvgIcons } from './Svg';

export interface IconProps {
  icon: ReactNode | ComponentType<unknown>;
  featherIcon?: boolean;
}

interface Props {
  icon: ReactNode | ComponentType<{ size?: string | number }>;
  feather?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  mode?:
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
}

export function Icon({ icon, feather, className, mode, size }: Props) {
  useEffect(() => {
    if (feather) {
      featherIcons.replace();
    }
  }, [feather]);

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
    return <Svg icon={svgIcon as keyof typeof SvgIcons} className={classes} />;
  }

  if (feather) {
    return (
      <i
        data-feather={icon}
        className={classes}
        aria-hidden="true"
        role="img"
      />
    );
  }

  return (
    <i className={clsx('fa', icon, classes)} aria-hidden="true" role="img" />
  );
}
