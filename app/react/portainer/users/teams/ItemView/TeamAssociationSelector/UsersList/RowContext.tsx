import { createRowContext } from '@@/datatables/RowContext';

interface RowContext {
  disabled?: boolean;
}

const { RowProvider, useRowContext } = createRowContext<RowContext>();

export { RowProvider, useRowContext };
