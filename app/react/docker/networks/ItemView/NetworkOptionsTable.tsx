import { Table, TableContainer, TableTitle } from '@@/datatables';
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
    <div className="row">
      <div className="col-lg-12 col-md-12 col-xs-12">
        <TableContainer>
          <TableTitle label="Network options" icon="share-2" featherIcon />
          <Table className="nopadding">
            <DetailsTable dataCy="networkDetails-networkOptionsTable">
              {networkEntries.map(([key, value]) => (
                <DetailsTable.Row key={key} label={key}>
                  {value}
                </DetailsTable.Row>
              ))}
            </DetailsTable>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
