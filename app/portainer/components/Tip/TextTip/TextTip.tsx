import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import styles from './TextTip.module.css';

export function TextTip({ children }: PropsWithChildren<unknown>) {
  return (
    <p className="text-muted small">
      <i
        aria-hidden="true"
        className={clsx(
          'fa fa-exclamation-circle',
          'orange-icon',
          styles.textMargin
        )}
      />
      {children}
    </p>
  );
}
