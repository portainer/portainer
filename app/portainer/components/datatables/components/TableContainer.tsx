import { createContext, PropsWithChildren, useContext } from 'react';

import { Widget, WidgetBody } from '@/portainer/components/widget';

const Context = createContext<null | boolean>(null);

export function useTableContext() {
  const context = useContext(Context);

  if (context == null) {
    throw new Error('Should be nested inside a TableContainer component');
  }
}

export function TableContainer({ children }: PropsWithChildren<unknown>) {
  return (
    <Context.Provider value>
      <div className="datatable">
        <Widget>
          <WidgetBody className="no-padding">{children}</WidgetBody>
        </Widget>
      </div>
    </Context.Provider>
  );
}
