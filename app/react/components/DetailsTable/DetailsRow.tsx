import clsx from 'clsx';
import { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  label: string;
  colClassName?: string;
  className?: string;
}

export function DetailsRow({
  label,
  children,
  colClassName,
  className,
}: Props) {
  return (
    <tr className={className}>
      <td className={clsx(colClassName, 'min-w-[150px] !break-normal')}>
        {label}
      </td>
      {!!children && (
        <td className={colClassName} data-cy={`detailsTable-${label}Value`}>
          {children}
        </td>
      )}
    </tr>
  );
}
