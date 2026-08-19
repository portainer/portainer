/**
 * Given the position in the sequence of pagination links, figure out what page number corresponds to that position.
 *
 * @param position
 * @param currentPage
 * @param paginationRange
 * @param totalPages
 */
export function calculatePageNumber(
  position: number,
  currentPage: number,
  paginationRange: number,
  totalPages: number
) {
  const halfWay = Math.ceil(paginationRange / 2);
  if (position === paginationRange) {
    return totalPages;
  }

  if (position === 1) {
    return position;
  }

  if (paginationRange < totalPages) {
    if (totalPages - halfWay < currentPage) {
      return totalPages - paginationRange + position;
    }

    if (halfWay < currentPage) {
      return currentPage - halfWay + position;
    }

    return position;
  }

  return position;
}
