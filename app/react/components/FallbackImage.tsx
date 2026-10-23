import { ReactNode, useState } from 'react';
import clsx from 'clsx';

interface Props {
  // props for the image to load
  src?: string; // a link to an external image
  fallbackIcon: ReactNode;
  alt?: string;
  className?: string;
}

export function FallbackImage({ src, fallbackIcon, alt, className }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>(
    'loading'
  );

  // while loading, the fallback renders alongside the hidden img rather than
  // replacing it — the img must stay mounted for onLoad/onError to fire
  return (
    <>
      {(!src || status !== 'loaded') && (
        <div className={className}>{fallbackIcon}</div>
      )}
      {!!src && status !== 'failed' && (
        <img
          className={clsx(className, status !== 'loaded' && 'hidden')}
          src={src}
          alt={alt}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
        />
      )}
    </>
  );
}
