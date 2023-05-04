import { PaginationControls } from '@@/PaginationControls';

import { Table } from './Table';
import { SelectedRowsCount } from './SelectedRowsCount';

interface Props {
  totalSelected: number;
  pageSize: number;
  page: number;
  onPageChange(page: number): void;
  totalCount: number;
  onPageSizeChange(pageSize: number): void;
}

export function DatatableFooter({
  totalSelected,
  pageSize,
  page,
  onPageChange,
  totalCount,
  onPageSizeChange,
}: Props) {
  return (
    <Table.Footer>
      <SelectedRowsCount value={totalSelected} />
      <PaginationControls
        showAll
        pageLimit={pageSize}
        page={page + 1}
        onPageChange={(page) => onPageChange(page - 1)}
        totalCount={totalCount}
        onPageLimitChange={onPageSizeChange}
      />
    </Table.Footer>
  );
}
