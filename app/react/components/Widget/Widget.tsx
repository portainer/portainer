import clsx from 'clsx';
import { createContext, PropsWithChildren, useContext } from 'react';

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
  id,
  'aria-label': ariaLabel,
}: PropsWithChildren<{
  className?: string;
  id?: string;
  'aria-label'?: string;
}>) {
  return (
    <Context.Provider value>
      <section
        id={id}
        className={clsx('widget', className)}
        aria-label={ariaLabel}
      >
        {children}
      </section>
    </Context.Provider>
  );
}
