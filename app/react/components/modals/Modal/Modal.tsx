import * as DialogPrimitive from '@radix-ui/react-dialog';
import { createContext, PropsWithChildren, useContext } from 'react';

import { cn } from '@/react/utils/cn';

import { CloseButton } from './CloseButton';

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
      <DialogPrimitive.Root
        open
        onOpenChange={(open) => {
          if (!open) onDismiss?.();
        }}
      >
        <DialogPrimitive.Portal>
          {/* Overlay */}
          <DialogPrimitive.Overlay
            className={cn(
              'fixed inset-0 z-[60]',
              'bg-black/80',
              'flex items-center justify-center',
              // Animations
              'data-[state=open]:animate-in data-[state=open]:fade-in-0',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
              'duration-200'
            )}
            // Radix DismissableLayer may set pointerEvents=none on body when Sheet is open — override
            style={{ pointerEvents: 'auto' }}
          >
            {/* Content */}
            <DialogPrimitive.Content
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              className={cn(
                'max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] bg-transparent p-0',
                {
                  'w-[450px]': size === 'md',
                  'w-[700px]': size === 'lg',
                  'w-[1000px]': size === 'xl',
                },
                // Animations
                'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                'duration-200',
                dialogClassName
              )}
              // Prevent click-outside from propagating to overlay dismiss when clicking inside
              onPointerDownOutside={(e) => {
                if (!onDismiss) e.preventDefault();
              }}
            >
              <div
                className={cn(
                  'relative overflow-y-auto rounded-lg p-5',
                  'bg-[var(--bg-modal-content-color)]',
                  'border border-black/20',
                  'shadow-[0_5px_15px_rgb(0_0_0/50%)]',
                  'th-highcontrast:border-[var(--border-widget)]',
                  className
                )}
              >
                {children}
                {onDismiss && <CloseButton onClose={onDismiss} />}
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Overlay>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </Context.Provider>
  );
}
