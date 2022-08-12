import { createRowContext } from '@@/datatables/RowContext';

interface RowContextState {
  isOpenAmtEnabled: boolean;
  groupName?: string;
}

const { RowProvider, useRowContext } = createRowContext<RowContextState>();

export { RowProvider, useRowContext };
