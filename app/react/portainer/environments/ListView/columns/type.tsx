import { CellContext } from '@tanstack/react-table';

import { environmentTypeIcon } from '@/portainer/filters/filters';
import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import { getPlatformTypeName } from '@/react/portainer/environments/utils';

import { Icon } from '@@/Icon';

import { columnHelper } from './helper';

export const type = columnHelper.accessor('Type', {
  header: 'Type',
  cell: Cell,
});

function Cell({ getValue, row }: CellContext<Environment, EnvironmentType>) {
  const type = getValue();
  const containerEngine = row.original.ContainerEngine;

  return (
    <span className="flex items-center gap-1">
      <Icon icon={environmentTypeIcon(type, containerEngine)} />
      {getPlatformTypeName(type)}
    </span>
  );
}
