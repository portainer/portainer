import clsx from 'clsx';
import {
  createContext,
  PropsWithChildren,
  Ref,
  useContext,
  useMemo,
} from 'react';

import { useId } from '@/react/hooks/useId';

interface WidgetContextValue {
  titleId: string | undefined;
}

const Context = createContext<null | WidgetContextValue>(null);
Context.displayName = 'WidgetContext';

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
  const generatedId = useId();
  const titleId = ariaLabel ? undefined : `widget-title-${generatedId}`;
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
