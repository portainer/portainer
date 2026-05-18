import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function HeaderStats({ children }: Props) {
  return <div className="flex items-stretch gap-3">{children}</div>;
}
