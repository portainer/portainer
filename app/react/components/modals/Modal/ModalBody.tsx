import { PropsWithChildren } from 'react';

import styles from './ModalBody.module.css';
import { CloseButton } from './CloseButton';
import { useModalContext } from './Modal';

interface Props {
  isCloseButtonVisible?: boolean;
}

export function ModalBody({
  children,
  isCloseButtonVisible,
}: PropsWithChildren<Props>) {
  const { onDismiss } = useModalContext();

  return (
    <div className={styles.modalBody}>
      {isCloseButtonVisible && <CloseButton onClose={onDismiss} />}
      {children}
    </div>
  );
}
