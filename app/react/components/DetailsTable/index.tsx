import { DetailsTable as MainComponent } from './DetailsTable';
import { DetailsRow } from './DetailsRow';

interface DetailsTableSubcomponents {
  Row: typeof DetailsRow;
}

const DetailsTable = MainComponent as typeof MainComponent &
  DetailsTableSubcomponents;

DetailsTable.Row = DetailsRow;

export { DetailsTable };
