import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  keyProp: string;
}

export function DetailsRow({ keyProp, children }: Props) {
  return (
    <tr>
      <td>{keyProp}</td>
      {children && <td data-cy={`detailsTable-${keyProp}Value`}>{children}</td>}
    </tr>
  );
}
