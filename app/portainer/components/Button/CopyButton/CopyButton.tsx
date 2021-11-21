import { PropsWithChildren, useState, useEffect } from 'react';
import clsx from 'clsx';

import { Button } from '../Button';

import styles from './CopyButton.module.css';

export interface Props {
  label?: string;
  copyText: string;
  fadeDelay?: number;
  displayText?: string;
  className?: string;
}

export function CopyButton({
  label,
  copyText,
  fadeDelay = 1000,
  displayText,
  className,
  children,
}: PropsWithChildren<Props>) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeoutTime = setTimeout(() => setIsFading(false), fadeDelay);
    // clear timeout when component unmounts
    return () => {
      clearTimeout(fadeoutTime);
    };
  }, [isFading, fadeDelay]);

  function onClick() {
    // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
    // https://caniuse.com/?search=clipboard
    navigator.clipboard.writeText(copyText);
    setIsFading(true);
  }

  return (
    <>
      <Button
        className={className}
        size="medium"
        onClick={onClick}
        title="Copy Value"
        type="button"
      >
        <i className="fa fa-copy space-right" aria-hidden="true" />{' '}
        {label || children}
      </Button>

      <span className={clsx(isFading && styles.fadeout, styles.displayText)}>
        <i className="fa fa-check" aria-hidden="true" /> {displayText}
      </span>
      {/* <button type="button" className="btn btn-link nopadding" title="Copy Value"> <i className="fa fa-copy" /> Copy </button> */}
      {/* <span ng-class="{ 'copy-button-fadeout': $ctrl.state.isFading }" class="copy-button-copy-text"> <i class="fa fa-check" aria-hidden="true"></i> copied </span> */}
    </>
  );
}
