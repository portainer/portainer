import { useState } from 'react';
import { CellContext } from '@tanstack/react-table';
import { FileText } from 'lucide-react';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

import { ResourceRow } from '../types';
import { DescribeModal } from '../DescribeModal';

import { columnHelper } from './helper';

export const actions = columnHelper.accessor((row) => row.status.label, {
  header: 'Actions',
  id: 'actions',
  cell: Cell,
  enableSorting: false,
});

function Cell({ row }: CellContext<ResourceRow, string>) {
  const { describe } = row.original;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        color="link"
        data-cy="helm-resource-describe"
        onClick={() => setModalOpen(true)}
        className="!ml-0 pl-0"
      >
        <Icon icon={FileText} />
        Describe
      </Button>

      {modalOpen && (
        <DescribeModal
          name={describe.name}
          resourceType={describe.resourceType}
          namespace={describe.namespace}
          onDismiss={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
