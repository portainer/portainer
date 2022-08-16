import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { Icon, IconMode, IconSize } from './Icon';

interface Props {
  // props for the image to load
  src: string; // a link to an external image
  fallbackIcon: string;
  alt?: string;
  size?: IconSize;
  className?: string;
  // additional fallback icon props
  fallbackMode?: IconMode;
  fallbackClassName?: string;
  feather?: boolean;
}

export function FallbackImage({
  src,
  fallbackIcon,
  alt,
  size,
  className,
  fallbackMode,
  fallbackClassName,
  feather,
}: Props) {
  const [error, setError] = useState(false);

  const classes = clsx(className, { [`icon-${size}`]: size });

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!error) {
    return (
      <img
        className={classes}
        src={src}
        alt={alt}
        onError={() => setError(true)}
      />
    );
  }

  // fallback icon if there is an error loading the image
  return (
    <Icon
      icon={fallbackIcon}
      feather={feather}
      className={fallbackClassName}
      size={size}
      mode={fallbackMode}
    />
  );
}
