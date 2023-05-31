import { ComponentProps, PropsWithChildren } from 'react';
import clsx from 'clsx';
import { Check, Copy } from 'lucide-react';

import { Icon } from '@@/Icon';

import { Button } from '../Button';

import styles from './CopyButton.module.css';
import { useCopy } from './useCopy';

export interface Props {
  copyText: string;
  fadeDelay?: number;
  displayText?: string;
  className?: string;
  color?: ComponentProps<typeof Button>['color'];
  indicatorPosition?: 'left' | 'right';
}

export function CopyButton({
  copyText,
  fadeDelay = 1000,
  displayText = 'copied',
  className,
  color,
  indicatorPosition = 'right',
  children,
}: PropsWithChildren<Props>) {
  const { handleCopy, copiedSuccessfully } = useCopy(copyText, fadeDelay);

  function copiedIndicator() {
    return (
      <span
        className={clsx(
          copiedSuccessfully && styles.fadeout,
          styles.copyButton,
          'mx-1',
          'vertical-center'
        )}
      >
        <Icon icon={Check} />
        {displayText && <span className="space-left">{displayText}</span>}
      </span>
    );
  }

  return (
    <div className={styles.container}>
      {indicatorPosition === 'left' && copiedIndicator()}
      <Button
        className={className}
        color={color}
        size="small"
        onClick={handleCopy}
        title="Copy Value"
        type="button"
        icon={Copy}
        disabled={!copyText}
      >
        {children}
      </Button>
      {indicatorPosition === 'right' && copiedIndicator()}
    </div>
  );
}
