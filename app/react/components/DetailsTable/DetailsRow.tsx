import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  label: string;
}

export function DetailsRow({ label, children }: Props) {
  return (
    <tr>
      <td>{label}</td>
      {children && <td data-cy={`detailsTable-${label}Value`}>{children}</td>}
    </tr>
  );
}
