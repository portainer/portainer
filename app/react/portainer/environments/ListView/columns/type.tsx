import { CellContext } from '@tanstack/react-table';

import {
  getEnvironmentTypeIcon,
  getPlatformTypeName,
} from '@/react/portainer/environments/utils';
import i18n from '@/i18n';

import { Icon } from '@@/Icon';

import { EnvironmentListItem } from '../types';
import { EnvironmentType, ContainerEngine } from '../../types';

import { columnHelper } from './helper';

type TypeCellContext = {
  type: EnvironmentType;
  containerEngine?: ContainerEngine;
};

export const type = columnHelper.accessor(
  (rowItem): TypeCellContext => ({
    type: rowItem.Type,
    containerEngine: rowItem.ContainerEngine,
  }),
  {
    header: () => i18n.t('environments.col_type'),
    cell: Cell,
    id: 'Type',
  }
);

function Cell({ getValue }: CellContext<EnvironmentListItem, TypeCellContext>) {
  const { type, containerEngine } = getValue();

  return (
    <span className="flex items-center gap-1">
      <Icon icon={getEnvironmentTypeIcon(type, containerEngine)} />
      {getPlatformTypeName(type, containerEngine)}
    </span>
  );
}
