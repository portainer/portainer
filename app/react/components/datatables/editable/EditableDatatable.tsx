import { useCallback, useEffect, useRef, useState } from 'react';

import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';
import { withMeta } from '@@/datatables/extend-options/withMeta';

import {
  Datatable,
  Props as DatatableProps,
  PaginationProps,
} from '../Datatable';
import { DefaultType } from '../types';

export const NEW_ROW_ID = -1;
export const UNSET_EDITABLE_ROW = -1;

interface Props<D extends DefaultType> extends Omit<DatatableProps<D>, 'meta'> {
  revertRow(rowIndex: number): void;
  acceptRow(rowIndex: number): void;
}

export function EditableDatatable<D extends DefaultType>({
  dataset,
  revertRow,
  acceptRow,
  ...props
}: Props<D> & PaginationProps) {
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [data, setData] = useState(dataset);
  const [editableRow, setEditableRow] = useState(-1);
  const [editableRowOriginalData, setEditableRowOriginalData] = useState<
    D | undefined
  >();

  useEffect(() => {
    setData(dataset);
  }, [dataset]);

  return (
    <Datatable<D>
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      dataset={data}
      extendTableOptions={mergeOptions(
        (options) => ({
          ...options,
          autoResetPageIndex,
        }),
        withMeta({
          getEditableRow: () => editableRow,
          getEditableRowOriginalData: () => editableRowOriginalData,
          editRow: (rowIndex: number, row: D) => {
            setEditableRow(rowIndex);
            setEditableRowOriginalData(row);
          },
          updateRow: (rowIndex: number, value: D) => {
            // Skip page index reset until after next rerender
            skipAutoResetPageIndex();
            setData((old: D[]) =>
              old.map((row, index) => (index === rowIndex ? value : row))
            );
          },
          revertRow,
          acceptRow,
        })
      )}
    />
  );
}

function useSkipper() {
  const shouldSkipRef = useRef(true);
  const shouldSkip = shouldSkipRef.current;

  // Wrap a function with this to skip a pagination reset temporarily
  const skip = useCallback(() => {
    shouldSkipRef.current = false;
  }, []);

  useEffect(() => {
    shouldSkipRef.current = true;
  });

  return [shouldSkip, skip] as const;
}
