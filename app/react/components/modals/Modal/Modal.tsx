import { DialogContent, DialogOverlay } from '@reach/dialog';
import clsx from 'clsx';
import { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import { OnSubmit } from './types';
import styles from './Modal.module.css';

interface IContext<TResult> {
  onSubmit: OnSubmit<TResult>;
}

const Context = createContext<IContext<unknown> | null>(null);
Context.displayName = 'ModalContext';

export function useModalContext<TResult>() {
  const context = useContext(Context);
  if (!context) {
    throw new Error('should be nested under Modal');
  }

  return context as IContext<TResult>;
}

interface Props<TResult> {
  onSubmit: OnSubmit<TResult>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export function Modal<TResult>({
  children,
  onSubmit,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: PropsWithChildren<Props<TResult>>) {
  const context = useMemo(
    () => ({ onSubmit: onSubmit as OnSubmit<unknown> }),
    [onSubmit]
  );

  return (
    <Context.Provider value={context}>
      <DialogOverlay
        isOpen
        className="flex items-center justify-center z-50"
        onDismiss={() => {
          onSubmit();
        }}
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
