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
  id,
}: PropsWithChildren<{
  id?: string;
}>) {
  return (
    <Context.Provider value>
      <div id={id} className="widget">
        {children}
      </div>
    </Context.Provider>
  );
}
