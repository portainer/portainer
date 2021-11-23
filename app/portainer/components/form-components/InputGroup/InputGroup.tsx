import clsx from 'clsx';
import { createContext, PropsWithChildren, useContext } from 'react';

const Context = createContext<null | boolean>(null);

type Size = 'small' | 'large';

export function useInputGroupContext() {
  const context = useContext(Context);

  if (context == null) {
    throw new Error('Should be inside a InputGroup component');
  }
}

interface Props {
  size?: Size;
}

export function InputGroup({ children, size }: PropsWithChildren<Props>) {
  return (
    <Context.Provider value>
      <div className={clsx('input-group', sizeClass(size))}>{children}</div>
    </Context.Provider>
  );
}

function sizeClass(size?: Size) {
  switch (size) {
    case 'large':
      return 'input-group-lg';
    case 'small':
      return 'input-group-sm';
    default:
      return '';
  }
}
