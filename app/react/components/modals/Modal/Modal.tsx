import { DialogContent, DialogOverlay } from '@reach/dialog';
import clsx from 'clsx';
import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import styles from './Modal.module.css';

interface IContext {
  onDismiss(): void;
}

const Context = createContext<IContext | null>(null);
Context.displayName = 'ModalContext';

export function useModalContext() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('should be nested under Modal');
  }

  return context;
}

interface Props {
  onDismiss(): void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function Modal({
  children,
  onDismiss,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: PropsWithChildren<Props>) {
  const context = useMemo(() => ({ onDismiss }), [onDismiss]);

  return (
    <Context.Provider value={context}>
      <DialogOverlay
        isOpen
        className="flex items-center justify-center z-50"
        onDismiss={() => onDismiss()}
        role="dialog"
      >
        <DialogContent
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={clsx(styles.modalDialog, 'p-0 bg-transparent')}
        >
          <div className={styles.modalContent}>{children}</div>
        </DialogContent>
      </DialogOverlay>
    </Context.Provider>
  );
}
