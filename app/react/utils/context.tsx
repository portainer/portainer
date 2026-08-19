import {
  PropsWithChildren,
  createContext as reactCreateContext,
  useContext as reactUseContext,
} from 'react';

/**
 * Reduce the boilerplate code to create a custom context and provider hook
 * @param displayName Display name of the Context in react inspector
 * @returns A Provider and custom hook for this context
 */
export function createContext<TContext>(displayName: string) {
  const Context = reactCreateContext<TContext | null>(null);
  Context.displayName = displayName;

  return { Provider, useContext };

  function Provider({
    children,
    context,
  }: PropsWithChildren<{ context: TContext }>) {
    return <Context.Provider value={context}>{children}</Context.Provider>;
  }

  function useContext() {
    const context = reactUseContext(Context);
    if (context === null) {
      throw new Error(`should be nested under Provider - ${displayName}`);
    }

    return context;
  }
}
