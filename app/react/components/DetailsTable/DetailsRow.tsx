import clsx from 'clsx';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  label: string;
  colClassName?: string;
  className?: string;
  columns?: Array<ReactNode>;
}

export function DetailsRow({
  label,
  children,
  colClassName,
  className,
  columns,
}: Props) {
  return (
    <tr className={className}>
      <td className={clsx(colClassName, 'min-w-[150px] !break-normal')}>
        {label}
      </td>
      <td className={colClassName} data-cy={`detailsTable-${label}Value`}>
        {children}
      </td>
      {columns?.map((column, index) => (
        <td key={index} className={colClassName}>
          {column}
        </td>
      ))}
    </tr>
  );
}
