import { generatePagesArray } from './generatePagesArray';
import { PageButton } from './PageButton';

interface Props {
  boundaryLinks?: boolean;
  currentPage: number;
  directionLinks?: boolean;
  itemsPerPage: number;
  onPageChange(page: number): void;
  totalCount: number;
  maxSize: number;
}

export function PageSelector({
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
  maxSize = 5,
  directionLinks = true,
  boundaryLinks = false,
}: Props) {
  const pages = generatePagesArray(
    currentPage,
    totalCount,
    itemsPerPage,
    maxSize
  );
  const last = pages[pages.length - 1];

  if (pages.length <= 1) {
    return null;
  }

  return (
    <ul className="pagination">
      {boundaryLinks ? (
        <PageButton
          onPageChange={onPageChange}
          page={1}
          disabled={currentPage === 1}
        >
          &laquo;
        </PageButton>
      ) : null}
      {directionLinks ? (
        <PageButton
          onPageChange={onPageChange}
          page={currentPage - 1}
          disabled={currentPage === 1}
        >
          &lsaquo;
        </PageButton>
      ) : null}
      {pages.map((pageNumber, index) => (
        <PageButton
          onPageChange={onPageChange}
          page={pageNumber}
          disabled={pageNumber === '...'}
          active={currentPage === pageNumber}
          key={index}
        >
          {pageNumber}
        </PageButton>
      ))}

      {directionLinks ? (
        <PageButton
          onPageChange={onPageChange}
          page={currentPage + 1}
          disabled={currentPage === last}
        >
          &rsaquo;
        </PageButton>
      ) : null}
      {boundaryLinks ? (
        <PageButton
          disabled={currentPage === last}
          onPageChange={onPageChange}
          page={last}
        >
          &raquo;
        </PageButton>
      ) : null}
    </ul>
  );
}
