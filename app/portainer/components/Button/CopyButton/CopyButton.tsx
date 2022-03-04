import { PropsWithChildren, useState, useEffect } from 'react';
import clsx from 'clsx';

import { Button } from '../Button';

import styles from './CopyButton.module.css';

export interface Props {
  copyText: string;
  fadeDelay?: number;
  displayText?: string;
  className?: string;
}

export function CopyButton({
  copyText,
  fadeDelay = 1000,
  displayText = 'copied',
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
    if (navigator.clipboard) {
      navigator.clipboard.writeText(copyText);
    } else {
      // https://stackoverflow.com/a/57192718
      const inputEl = document.createElement('input');
      inputEl.value = copyText;
      inputEl.type = 'text';
      document.body.appendChild(inputEl);
      inputEl.select();
      document.execCommand('copy');
      inputEl.type = 'hidden';
      document.body.removeChild(inputEl);
    }
    setIsFading(true);
  }

  return (
    <div className={styles.container}>
      <Button
        className={className}
        size="small"
        onClick={onClick}
        title="Copy Value"
        type="button"
      >
        <i className="fa fa-copy space-right" aria-hidden="true" /> {children}
      </Button>

      <span className={clsx(isFading && styles.fadeout, styles.displayText)}>
        <i className="fa fa-check" aria-hidden="true" /> {displayText}
      </span>
    </div>
  );
}
