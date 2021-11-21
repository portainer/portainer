import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import styles from './TextTip.module.css';

export interface Props {
  text?: string;
}

export function TextTip({
  text = "",
  children,
}: PropsWithChildren<Props>) {
  return (
    <p className="text-muted">
      <i
        aria-hidden="true"
        className={clsx(
          "fa fa-exclamation-circle",
          "orange-icon",
          styles.textMargin
        )}
      />
      {text || children}
    </p>
  );
}
