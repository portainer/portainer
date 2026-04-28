import clsx from 'clsx';
import {
  createContext,
  PropsWithChildren,
  Ref,
  useContext,
  useMemo,
  useState,
} from 'react';

interface WidgetContextValue {
  titleId: string | undefined;
}

const Context = createContext<null | WidgetContextValue>(null);
Context.displayName = 'WidgetContext';

// Simple ID generator for React 17 compatibility
let idCounter = 0;
function generateId() {
  return `widget-title-${++idCounter}`;
}

export function useWidgetContext() {
  const context = useContext(Context);

  if (context == null) {
    throw new Error('Should be inside a Widget component');
  }

  return context;
}

export function Widget({
  children,
  className,
  mRef,
  id,
  'aria-label': ariaLabel,
  'data-cy': dataCy,
}: PropsWithChildren<{
  className?: string;
  mRef?: Ref<HTMLDivElement>;
  id?: string;
  'aria-label'?: string;
  'data-cy'?: string;
}>) {
  // Only generate titleId once on mount if aria-label is not provided
  const [titleId] = useState(() => (ariaLabel ? undefined : generateId()));
  const contextValue = useMemo(() => ({ titleId }), [titleId]);

  return (
    <Context.Provider value={contextValue}>
      <section
        id={id}
        className={clsx('widget', className)}
        ref={mRef}
        aria-label={ariaLabel}
        aria-labelledby={titleId}
        data-cy={dataCy}
      >
        {children}
      </section>
    </Context.Provider>
  );
}
