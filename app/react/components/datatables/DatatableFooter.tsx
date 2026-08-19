import { PaginationControls } from '@@/PaginationControls';

import { Table } from './Table';
import { SelectedRowsCount } from './SelectedRowsCount';

interface Props {
  totalSelected: number;
  totalHiddenSelected: number;
  pageSize: number;
  page: number;
  onPageChange(page: number): void;
  pageCount: number;
  onPageSizeChange(pageSize: number): void;
}

export function DatatableFooter({
  totalSelected,
  totalHiddenSelected,
  pageSize,
  page,
  onPageChange,
  pageCount,
  onPageSizeChange,
}: Props) {
  return (
    <Table.Footer>
      <SelectedRowsCount value={totalSelected} hidden={totalHiddenSelected} />
      <PaginationControls
        showAll
        pageLimit={pageSize}
        page={page + 1}
        onPageChange={(page) => onPageChange(page - 1)}
        pageCount={pageCount}
        onPageLimitChange={onPageSizeChange}
      />
    </Table.Footer>
  );
}
