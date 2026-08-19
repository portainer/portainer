import { ComponentProps, PropsWithChildren } from 'react';
import clsx from 'clsx';
import { Check, Copy } from 'lucide-react';

import { AutomationTestingProps } from '@/types';

import { Icon } from '@@/Icon';

import { Button } from '../Button';

import styles from './CopyButton.module.css';
import { useCopy } from './useCopy';

export interface Props extends AutomationTestingProps {
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
  color = 'default',
  indicatorPosition = 'right',
  children,
  'data-cy': dataCy,
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
        className={clsx(className, '!ml-0')}
        color={color}
        size="small"
        onClick={handleCopy}
        title="Copy Value"
        type="button"
        icon={Copy}
        disabled={!copyText}
        data-cy={dataCy}
      >
        {children}
      </Button>
      {indicatorPosition === 'right' && copiedIndicator()}
    </div>
  );
}
