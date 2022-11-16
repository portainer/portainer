import { PropsWithChildren } from 'react';

import styles from './ModalBody.module.css';
import { CloseButton } from './CloseButton';
import { useModalContext } from './Modal';

interface Props {
  isCloseButtonVisible?: boolean;
}

export function ModalBody<TResult = unknown>({
  children,
  isCloseButtonVisible,
}: PropsWithChildren<Props>) {
  const { onSubmit } = useModalContext<TResult>();

  return (
    <div className={styles.modalBody}>
      {isCloseButtonVisible && <CloseButton onClose={onSubmit} />}
      <div className={styles.bootboxBody}>{children}</div>
    </div>
  );
}
