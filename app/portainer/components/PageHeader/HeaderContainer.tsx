import { PropsWithChildren, createContext, useContext } from 'react';

import './HeaderContainer.css';

const Context = createContext<null | boolean>(null);

export function useHeaderContext() {
  const context = useContext(Context);

  if (context == null) {
    throw new Error('Should be nested inside a HeaderContainer component');
  }
}

export function HeaderContainer({ children }: PropsWithChildren<unknown>) {
  return (
    <Context.Provider value>
      <div className="row header">
        <div id="loadingbar-placeholder" />
        <div className="col-xs-12">
          <div className="meta">{children}</div>
        </div>
      </div>
    </Context.Provider>
  );
}

export const HeaderAngular = {
  transclude: true,
  templateUrl: './HeaderContainer.html',
};
