import { Fragment, PropsWithChildren } from 'react';
import { Row } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

import { DefaultType } from './types';

interface Props<T extends DefaultType = DefaultType> {
  isLoading?: boolean;
  rows: Row<T>[];
  emptyContent?: string;
  renderRow(row: Row<T>): React.ReactNode;
}

export function TableContent<T extends DefaultType = DefaultType>({
  isLoading = false,
  rows,
  emptyContent,
  renderRow,
}: Props<T>) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableContentOneColumn>{t('common.loading')}</TableContentOneColumn>;
  }

  if (!rows.length) {
    return (
      <TableContentOneColumn>
        {emptyContent ?? t('common.no_items_available')}
      </TableContentOneColumn>
    );
  }

  return (
    <>
      {rows.map((row, index) => (
        <Fragment key={`${row.id}-${index}`}>{renderRow(row)}</Fragment>
      ))}
    </>
  );
}

function TableContentOneColumn({ children }: PropsWithChildren<unknown>) {
  // using MAX_SAFE_INTEGER to make sure the single column will be the size of the table
  return (
    <tr>
      <td colSpan={Number.MAX_SAFE_INTEGER} className="text-muted text-center">
        {children}
      </td>
    </tr>
  );
}
