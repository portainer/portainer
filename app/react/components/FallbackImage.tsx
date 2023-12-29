import { ReactNode, useEffect, useState } from 'react';

interface Props {
  // props for the image to load
  src?: string; // a link to an external image
  fallbackIcon: ReactNode;
  alt?: string;
  className?: string;
}

export function FallbackImage({ src, fallbackIcon, alt, className }: Props) {
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
  return <>{fallbackIcon}</>;
}
