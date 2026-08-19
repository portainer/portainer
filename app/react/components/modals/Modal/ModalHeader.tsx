import clsx from 'clsx';
import { ReactNode } from 'react';

import { ModalType } from './types';
import { useModalContext } from './Modal';
import styles from './ModalHeader.module.css';

interface Props {
  title: ReactNode;
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
      {typeof title === 'string' ? (
        <h5 className="m-0 font-bold">{title}</h5>
      ) : (
        title
      )}
    </div>
  );
}
