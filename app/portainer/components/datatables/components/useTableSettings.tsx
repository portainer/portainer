import { Context, createContext, ReactNode, useContext, useState } from 'react';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';

export interface TableSettingsContextInterface<T> {
  settings: T;
  setTableSettings(partialSettings: Partial<T>): void;
  setTableSettings(mutation: (settings: T) => T): void;
}

const TableSettingsContext = createContext<TableSettingsContextInterface<
  Record<string, unknown>
> | null>(null);

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
  defaults?: T;
  storageKey: string;
}

export function TableSettingsProvider<T>({
  children,
  defaults,
  storageKey,
}: ProviderProps<T>) {
  const Context = getContextType<T>();

  const [storage, setStorage] = useLocalStorage<T>(
    keyBuilder(storageKey),
    defaults as T
  );

  const [settings, setTableSettings] = useState(storage);

  return (
    <Context.Provider value={{ settings, setTableSettings: handleChange }}>
      {children}
    </Context.Provider>
  );

  function handleChange(partialSettings: T): void;
  function handleChange(mutation: (settings: T) => T): void;
  function handleChange(mutation: T | ((settings: T) => T)): void {
    setTableSettings((settings) => {
      const newTableSettings =
        mutation instanceof Function
          ? mutation(settings)
          : { ...settings, ...mutation };

      setStorage(newTableSettings);

      return newTableSettings;
    });
  }

  function keyBuilder(key: string) {
    return `datatable_TableSettings_${key}`;
  }
}

function getContextType<T>() {
  return (TableSettingsContext as unknown) as Context<
    TableSettingsContextInterface<T>
  >;
}
