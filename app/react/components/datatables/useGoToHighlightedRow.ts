import _ from 'lodash';
import { useRef, useLayoutEffect, useEffect } from 'react';

export function useGoToHighlightedRow<T extends { id: string }>(
  isServerSidePagination: boolean,
  pageSize: number,
  rows: Array<T>,
  goToPage: (page: number) => void,
  highlightedItemId?: string
) {
  const handlePageChangeRef = useRef(goToPage);
  useLayoutEffect(() => {
    handlePageChangeRef.current = goToPage;
  });

  const highlightedItemIdRef = useRef<string>();

  useEffect(() => {
    if (
      !isServerSidePagination &&
      highlightedItemId &&
      highlightedItemId !== highlightedItemIdRef.current
    ) {
      const page = getRowPage(highlightedItemId, pageSize, rows);
      if (page) {
        handlePageChangeRef.current(page);
      }
      highlightedItemIdRef.current = highlightedItemId;
    }
  }, [highlightedItemId, isServerSidePagination, rows, pageSize]);
}

function getRowPage<T extends { id: string }>(
  rowID: string,
  pageSize: number,
  rows: Array<T>
) {
  const totalRows = rows.length;

  if (!rowID || pageSize > totalRows) {
    return 0;
  }

  const paginatedData = _.chunk(rows, pageSize);

  const itemPage = paginatedData.findIndex((sub) =>
    sub.some((row) => row.id === rowID)
  );

  return itemPage;
}
