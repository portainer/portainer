import { createContext, PropsWithChildren, useContext } from 'react';

export function createRowContext<TContext>() {
  const Context = createContext<TContext | null>(null);

  return { RowProvider, useRowContext };

  function RowProvider({
    children,
    context,
  }: PropsWithChildren<{ context: TContext }>) {
    return <Context.Provider value={context}>{children}</Context.Provider>;
  }

  function useRowContext() {
    const context = useContext(Context);
    if (!context) {
      throw new Error('should be nested under RowProvider');
    }

    return context;
  }
}
