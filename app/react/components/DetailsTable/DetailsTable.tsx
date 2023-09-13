import clsx from 'clsx';
import { Children, PropsWithChildren } from 'react';

type Props = {
  headers?: string[];
  dataCy?: string;
  className?: string;
  emptyMessage?: string;
};

export function DetailsTable({
  headers = [],
  dataCy,
  className,
  emptyMessage,
  children,
}: PropsWithChildren<Props>) {
  return (
    <table className={clsx('table', className)} data-cy={dataCy}>
      {headers.length > 0 && (
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {Children.count(children) > 0 ? (
          children
        ) : (
          <tr>
            <td colSpan={headers.length} className="text-muted text-center">
              {emptyMessage}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
