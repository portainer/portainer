import { Trash2 } from 'lucide-react';

import { DetailsTable } from '@@/DetailsTable';
import { Button } from '@@/buttons';

import { Pair } from '../../types';

export function HiddenContainersTable({
  labels,
  isLoading,
  onDelete,
}: {
  labels: Pair[];
  isLoading: boolean;
  onDelete: (name: string) => void;
}) {
  return (
    <DetailsTable
      headers={['Name', 'Value', '']}
      className="table-hover"
      emptyMessage="No filter available."
      dataCy="hidden-containers-table"
    >
      {labels.map((label, index) => (
        <DetailsTable.Row
          key={index}
          label={label.name}
          columns={[
            <Button
              color="danger"
              data-cy="hidden-containers-remove-filter-button"
              size="xsmall"
              icon={Trash2}
              onClick={() => onDelete(label.name)}
              disabled={isLoading}
            >
              Remove
            </Button>,
          ]}
        >
          {label.value}
        </DetailsTable.Row>
      ))}
    </DetailsTable>
  );
}
