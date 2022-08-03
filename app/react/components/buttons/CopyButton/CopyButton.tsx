import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { Icon } from '@@/Icon';

import { Button } from '../Button';

import styles from './CopyButton.module.css';
import { useCopy } from './useCopy';

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
  const { handleCopy, copiedSuccessfully } = useCopy(copyText, fadeDelay);

  return (
    <div className={styles.container}>
      <Button
        className={className}
        size="small"
        onClick={handleCopy}
        title="Copy Value"
        type="button"
      >
        <Icon icon="copy" feather />
        {children}
      </Button>

      <span
        className={clsx(
          copiedSuccessfully && styles.fadeout,
          styles.displayText,
          'space-left',
          'vertical-center'
        )}
      >
        <Icon icon="check" feather />
        {displayText && <span className="space-left">{displayText}</span>}
      </span>
    </div>
  );
}
