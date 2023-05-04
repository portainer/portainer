import { useEffect, useState } from 'react';

import { BadgeIcon, BadgeSize } from './BadgeIcon/BadgeIcon';

interface Props {
  // props for the image to load
  src: string; // a link to an external image
  fallbackIcon: string;
  alt?: string;
  size?: BadgeSize;
  className?: string;
}

export function FallbackImage({
  src,
  fallbackIcon,
  alt,
  size,
  className,
}: Props) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  if (!error && src) {
    return (
      <img
        className={className}
        src={src}
        alt={alt}
        onError={() => setError(true)}
      />
    );
  }

  // fallback icon if there is an error loading the image
  return <BadgeIcon icon={fallbackIcon} size={size} />;
}
