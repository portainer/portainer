import { Network } from 'lucide-react';

import { TableContainer, TableTitle } from '@@/datatables';
import { DetailsTable } from '@@/DetailsTable';

import { NetworkOptions } from '../types';

type Props = {
  options: NetworkOptions;
};

export function NetworkOptionsTable({ options }: Props) {
  const networkEntries = Object.entries(options);

  if (networkEntries.length === 0) {
    return null;
  }

  return (
    <TableContainer>
      <TableTitle label="Network options" icon={Network} />
      <DetailsTable dataCy="networkDetails-networkOptionsTable">
        {networkEntries.map(([key, value]) => (
          <DetailsTable.Row key={key} label={key}>
            {value}
          </DetailsTable.Row>
        ))}
      </DetailsTable>
    </TableContainer>
  );
}
