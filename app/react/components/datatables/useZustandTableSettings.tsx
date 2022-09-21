import { Context, createContext, ReactNode, useContext, useMemo } from 'react';

interface TableSettingsContextInterface<T> {
  settings: T;
}

const TableSettingsContext = createContext<TableSettingsContextInterface<
  Record<string, unknown>
> | null>(null);
TableSettingsContext.displayName = 'TableSettingsContext';

export function useTableSettings<T>() {
  const Context = getContextType<T>();

  const context = useContext(Context);

  if (context === null) {
    throw new Error('must be nested under TableSettingsProvider');
  }

  return context;
}

interface ProviderProps<T> {
  children: ReactNode;
  settings: T;
}

export function TableSettingsProvider<T>({
  children,
  settings,
}: ProviderProps<T>) {
  const Context = getContextType<T>();

  const contextValue = useMemo(
    () => ({
      settings,
    }),
    [settings]
  );

  return <Context.Provider value={contextValue}>{children}</Context.Provider>;
}

function getContextType<T>() {
  return TableSettingsContext as unknown as Context<
    TableSettingsContextInterface<T>
  >;
}
