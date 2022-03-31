import { PropsWithChildren } from 'react';

export function DetailsTable({ children }: PropsWithChildren<unknown>) {
  return (
    <table className="table">
      <tbody>{children}</tbody>
    </table>
  );
}
