import { PropsWithChildren } from 'react';

import { useModalContext } from './Modal';
import styles from './ModalBody.module.css';

export function ModalBody({ children }: PropsWithChildren<unknown>) {
  useModalContext();
  return <div className={styles.modalBody}>{children}</div>;
}
