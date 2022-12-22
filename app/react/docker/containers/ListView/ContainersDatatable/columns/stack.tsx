import { Column } from 'react-table';
import { useSref } from '@uirouter/react';

import type { DockerContainer } from '@/react/docker/containers/types';

export const stack: Column<DockerContainer> = {
  Header: 'Stack',
  accessor: (row) => row.StackName || '',
  id: 'stack',
  sortType: 'string',
  disableFilters: true,
  Cell: StackCell,
  canHide: true,
  Filter: () => null,
};

interface Props {
  value: string;
}

function StackCell({ value: stackName }: Props) {
  const linkProps = useSref('docker.stacks.stack', { name: stackName });

  if (!stackName) {
    return '-';
  }

  return (
    <a href={linkProps.href} onClick={linkProps.onClick}>
      {stackName}
    </a>
  );
}
