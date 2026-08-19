import { Context, createContext, ReactNode, useContext } from 'react';
import { StoreApi, useStore } from 'zustand';

const TableSettingsContext = createContext<StoreApi<object> | null>(null);
TableSettingsContext.displayName = 'TableSettingsContext';

export function useTableSettings<T extends object>() {
  const Context = getContextType<T>();

  const context = useContext(Context);
  if (context === null) {
    throw new Error('must be nested under TableSettingsProvider');
  }

  return useStore(context);
}

interface ProviderProps<T extends object> {
  children: ReactNode;
  settings: StoreApi<T>;
}

export function TableSettingsProvider<T extends object>({
  children,
  settings,
}: ProviderProps<T>) {
  const Context = getContextType<T>();

  return <Context.Provider value={settings}>{children}</Context.Provider>;
}

function getContextType<T extends object>() {
  return TableSettingsContext as unknown as Context<StoreApi<T>>;
}
