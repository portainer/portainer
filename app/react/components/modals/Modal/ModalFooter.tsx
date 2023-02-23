import { PropsWithChildren } from 'react';

import { useModalContext } from './Modal';

export function ModalFooter({ children }: PropsWithChildren<unknown>) {
  useModalContext();

  return (
    <div className="flex justify-end gap-3 pt-3 [&>*]:flex-1">{children}</div>
  );
}
