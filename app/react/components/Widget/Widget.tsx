import clsx from 'clsx';
import { createContext, PropsWithChildren, Ref, useContext } from 'react';

const Context = createContext<null | boolean>(null);
Context.displayName = 'WidgetContext';

export function useWidgetContext() {
  const context = useContext(Context);

  if (context == null) {
    throw new Error('Should be inside a Widget component');
  }
}

export function Widget({
  children,
  className,
  mRef,
  id,
  'aria-label': ariaLabel,
}: PropsWithChildren<{
  className?: string;
  mRef?: Ref<HTMLDivElement>;
  id?: string;
  'aria-label'?: string;
}>) {
  return (
    <Context.Provider value>
      <section
        id={id}
        className={clsx('widget', className)}
        ref={mRef}
        aria-label={ariaLabel}
      >
        {children}
      </section>
    </Context.Provider>
  );
}
