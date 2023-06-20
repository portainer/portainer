import { PropsWithChildren } from 'react';
import clsx from 'clsx';

import { useInputGroupContext } from './InputGroup';

export function InputGroupButtonWrapper({
  children,
}: PropsWithChildren<unknown>) {
  useInputGroupContext();

  return (
    <span
      className={clsx(
        'input-group-btn [&>button]:!ml-0',
        // the button should be rounded at the end (right) if it's the last child and start (left) if it's the first child
        // if the button is in the middle of the group, it shouldn't be rounded
        '[&>button]:!rounded-none [&:last-child>button]:!rounded-r-[5px] [&:first-child>button]:!rounded-l-[5px]'
      )}
    >
      {children}
    </span>
  );
}
