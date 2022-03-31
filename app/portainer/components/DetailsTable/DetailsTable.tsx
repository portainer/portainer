import { PropsWithChildren } from 'react';

type Props = {
  headers?: string[];
};

export function DetailsTable({ headers, children }: PropsWithChildren<Props>) {
  return (
    <table className="table">
      {headers && headers.length > 0 && (
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>{children}</tbody>
    </table>
  );
}
