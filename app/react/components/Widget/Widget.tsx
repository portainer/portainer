import { createContext, PropsWithChildren, useContext } from 'react';

const Context = createContext<null | boolean>(null);

export function useWidgetContext() {
  const context = useContext(Context);

  if (context == null) {
    throw new Error('Should be inside a Widget component');
  }
}

export function Widget({ children }: PropsWithChildren<unknown>) {
  return (
    <Context.Provider value>
      <div className="widget">{children}</div>
    </Context.Provider>
  );
}
