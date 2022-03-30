import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  keyProp: string;
}

export function DetailsTableKeyValueRow({ keyProp, children }: Props) {
  return (
    <tr>
      <td>{keyProp}</td>
      <td data-cy={`detailsTable-${keyProp}Value`}>{children}</td>
    </tr>
  );
}
