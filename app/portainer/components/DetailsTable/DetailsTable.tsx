import { ReactNode } from 'react';

export interface Props {
  children: ReactNode;
}

export function DetailsTable({ children }: Props) {
  return (
    <table className="table">
      <tbody>{children}</tbody>
    </table>
  );
}
