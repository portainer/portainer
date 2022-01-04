import { ItemsPerPageSelector } from './ItemsPerPageSelector';
import { PageSelector } from './PageSelector';

interface Props {
  onPageChange(page: number): void;
  onPageLimitChange(value: number): void;
  page: number;
  pageLimit: number;
  showAll: boolean;
  totalCount: number;
}

export function PaginationControls({
  pageLimit,
  page,
  onPageLimitChange,
  showAll,
  onPageChange,
  totalCount,
}: Props) {
  return (
    <div className="paginationControls">
      <form className="form-inline">
        <ItemsPerPageSelector
          value={pageLimit}
          onChange={handlePageLimitChange}
          showAll={showAll}
        />
        {pageLimit !== 0 && (
          <PageSelector
            maxSize={5}
            onPageChange={onPageChange}
            currentPage={page}
            itemsPerPage={pageLimit}
            totalCount={totalCount}
          />
        )}
      </form>
    </div>
  );

  function handlePageLimitChange(value: number) {
    onPageLimitChange(value);
    onPageChange(1);
  }
}
