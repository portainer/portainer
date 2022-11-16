import clsx from 'clsx';

import { ModalType } from './types';
import { CloseButton } from './CloseButton';
import { useModalContext } from './Modal';
import styles from './ModalHeader.module.css';

interface Props {
  title: string;
  modalType?: ModalType;
}

export function ModalHeader({ title, modalType }: Props) {
  const { onDismiss } = useModalContext();

  return (
    <div className={styles.modalHeader}>
      <CloseButton onClose={onDismiss} className={styles.close} />
      {modalType && (
        <div
          className={clsx({
            [styles.backgroundError]: modalType === ModalType.Destructive,
            [styles.backgroundWarning]: modalType === ModalType.Warn,
          })}
        />
      )}
      <h5 className={styles.modalTitle}>{title}</h5>
    </div>
  );
}
