import { PropsWithChildren } from 'react';

export function TableFooter({ children }: PropsWithChildren<unknown>) {
  return <footer className="footer">{children}</footer>;
}
