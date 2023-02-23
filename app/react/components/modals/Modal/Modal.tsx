import { DialogContent, DialogOverlay } from '@reach/dialog';
import clsx from 'clsx';
import { createContext, PropsWithChildren, useContext } from 'react';

import { CloseButton } from './CloseButton';
import styles from './Modal.module.css';

const Context = createContext<boolean | null>(null);
Context.displayName = 'ModalContext';

export function useModalContext() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('should be nested under Modal');
  }

  return context;
}

interface Props {
  onDismiss?(): void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  size?: 'md' | 'lg';
  className?: string;
}

export function Modal({
  children,
  onDismiss,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  size = 'md',
  className,
}: PropsWithChildren<Props>) {
  return (
    <Context.Provider value>
      <DialogOverlay
        isOpen
        className={clsx(
          styles.overlay,
          'z-50 flex items-center justify-center'
        )}
        onDismiss={onDismiss}
        role="dialog"
      >
        <DialogContent
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={clsx(styles.modalDialog, 'bg-transparent p-0', {
            'w-[450px]': size === 'md',
            'w-[700px]': size === 'lg',
          })}
        >
          <div className={clsx(styles.modalContent, 'relative', className)}>
            {children}
            {onDismiss && <CloseButton onClose={onDismiss} />}
          </div>
        </DialogContent>
      </DialogOverlay>
    </Context.Provider>
  );
}
