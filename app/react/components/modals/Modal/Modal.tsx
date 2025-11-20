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
  resizable?: boolean;
}

export function Modal({
  children,
  onDismiss,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  size = 'md',
  className,
  resizable
}: PropsWithChildren<Props>) {
  return (
    <Context.Provider value>
      <DialogOverlay
        isOpen
        className={clsx(
          styles.overlay,
          'flex items-center justify-center z-50',
        )}
        onDismiss={onDismiss}
        role="dialog"
      >
        <DialogContent
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={clsx(
            styles.modalDialog,
            'max-w-[calc(100vw-2rem)] bg-transparent p-0',
            {
              'w-[450px]': size === 'md',
              'w-[700px]': size === 'lg',
              'w-[1000px]': size === 'xl',
              [styles.resizable]: resizable
            }
          )}
        >
          <div
            className={clsx(
              styles.modalContent,
              'relative overflow-y-auto p-5 rounded-lg flex flex-grow flex-col',
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
