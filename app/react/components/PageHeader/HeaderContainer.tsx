import { PropsWithChildren, createContext, useContext } from 'react';

const Context = createContext<null | boolean>(null);
Context.displayName = 'PageHeaderContext';

export function useHeaderContext() {
  const context = useContext(Context);

  if (context == null) {
    throw new Error('Should be nested inside a HeaderContainer component');
  }
}
interface Props {
  id?: string;
}

export function HeaderContainer({ id, children }: PropsWithChildren<Props>) {
  return (
    <Context.Provider value>
      <div
        id={id}
        className="row !mb-[5px] min-h-[60px] !rounded-none !border-0 !border-b !border-solid !border-b-[var(--border-widget)] bg-[var(--bg-widget-color)] !shadow-none"
      >
        <div id="loadingbar-placeholder" />
        <div className="col-xs-12">
          <div className="flex items-center justify-between [&_div]:truncate">
            {children}
          </div>
        </div>
      </div>
    </Context.Provider>
  );
}
