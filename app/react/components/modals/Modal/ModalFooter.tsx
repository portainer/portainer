import clsx from 'clsx';
import { PropsWithChildren } from 'react';

import { useModalContext } from './Modal';
import styles from './ModalFooter.module.css';

export function ModalFooter({ children }: PropsWithChildren<unknown>) {
  useModalContext();

  return (
    <div className={clsx(styles.modalFooter, 'flex justify-end')}>
      {children}
    </div>
  );
}
