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
  size?: 'md' | 'lg' | 'xl';
  className?: string;
  dialogClassName?: string;
}

export function Modal({
  children,
  onDismiss,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  size = 'md',
  className,
  dialogClassName,
}: PropsWithChildren<Props>) {
  return (
    <Context.Provider value>
      <DialogOverlay
        isOpen
        className={clsx(styles.overlay, 'flex items-center justify-center')}
        onDismiss={onDismiss}
        // When a Sheet is open and then a Modal opens, Radix DismissableLayer sets body.style.pointerEvents="none" for this modal overlay, so make it auto here.
        // z-index ensures the modal renders above the base views and any Sheet (z-50).
        style={{ zIndex: 60, pointerEvents: 'auto' }}
      >
        <DialogContent
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={clsx(
            styles.modalDialog,
            'max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] bg-transparent p-0',
            {
              'w-[450px]': size === 'md',
              'w-[700px]': size === 'lg',
              'w-[1000px]': size === 'xl',
            },
            dialogClassName
          )}
        >
          <div
            className={clsx(
              styles.modalContent,
              'relative overflow-y-auto rounded-lg p-5',
              className
            )}
          >
            {children}
            {onDismiss && <CloseButton onClose={onDismiss} />}
          </div>
        </DialogContent>
      </DialogOverlay>
    </Context.Provider>
  );
}
