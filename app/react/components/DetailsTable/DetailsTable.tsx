import { PropsWithChildren } from 'react';

type Props = {
  headers?: string[];
  dataCy?: string;
};

export function DetailsTable({
  headers = [],
  dataCy,
  children,
}: PropsWithChildren<Props>) {
  return (
    <table className="table" data-cy={dataCy}>
      {headers.length > 0 && (
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
