import clsx from 'clsx';

import { ModalType } from './types';
import { useModalContext } from './Modal';
import styles from './ModalHeader.module.css';

interface Props {
  title: string;
  modalType?: ModalType;
}

export function ModalHeader({ title, modalType }: Props) {
  useModalContext();

  return (
    <div className={styles.modalHeader}>
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
