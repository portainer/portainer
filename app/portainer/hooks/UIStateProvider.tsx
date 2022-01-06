import { createContext, PropsWithChildren, useContext } from 'react';

import { useLocalStorage } from '@/portainer/hooks/useLocalStorage';

interface UIState {
  dismissedInfoPanels: Record<string, string>;
  dismissedInfoHash: string;
}

type UIStateService = [UIState, (state: UIState) => void];

const Context = createContext<null | UIStateService>(null);

export function useUIState() {
  const context = useContext(Context);

  if (context == null) {
    throw new Error('Should be nested under a UIStateProvider component');
  }

  return context;
}

export function UIStateProvider({ children }: PropsWithChildren<unknown>) {
  const service = useLocalStorage<UIState>('UI_STATE', {} as UIState);

  return <Context.Provider value={service}>{children}</Context.Provider>;
}
