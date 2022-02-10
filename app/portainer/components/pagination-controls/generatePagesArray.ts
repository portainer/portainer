import { calculatePageNumber } from './calculatePageNumber';

export /**
 * Generate an array of page numbers (or the '...' string) which is used in an ng-repeat to generate the
 * links used in pagination
 *
 * @param currentPage
 * @param rowsPerPage
 * @param paginationRange
 * @param collectionLength
 * @returns {Array}
 */
function generatePagesArray(
  currentPage: number,
  collectionLength: number,
  rowsPerPage: number,
  paginationRange: number
): (number | '...')[] {
  const pages: (number | '...')[] = [];
  const totalPages = Math.ceil(collectionLength / rowsPerPage);
  const halfWay = Math.ceil(paginationRange / 2);

  let position;
  if (currentPage <= halfWay) {
    position = 'start';
  } else if (totalPages - halfWay < currentPage) {
    position = 'end';
  } else {
    position = 'middle';
  }

  const ellipsesNeeded = paginationRange < totalPages;

  for (let i = 1; i <= totalPages && i <= paginationRange; i += 1) {
    const pageNumber = calculatePageNumber(
      i,
      currentPage,
      paginationRange,
      totalPages
    );

    const openingEllipsesNeeded =
      i === 2 && (position === 'middle' || position === 'end');
    const closingEllipsesNeeded =
      i === paginationRange - 1 &&
      (position === 'middle' || position === 'start');
    if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
      pages.push('...');
    } else {
      pages.push(pageNumber);
    }
  }

  return pages;
}
