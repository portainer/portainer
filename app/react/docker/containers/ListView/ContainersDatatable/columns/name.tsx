import { CellContext } from '@tanstack/react-table';
import _ from 'lodash';
import { useSref } from '@uirouter/react';

import type { ContainerListViewModel } from '@/react/docker/containers/types';
import i18n from '@/i18n';

import { useTableSettings } from '@@/datatables/useTableSettings';

import { TableSettings } from '../types';

import { columnHelper } from './helper';

export const name = columnHelper.accessor((row) => row.Names[0], {
  header: i18n.t('common.name') as string,
  id: 'name',
  cell: NameCell,
});

export function NameCell({
  getValue,
  row: { original: container },
}: CellContext<ContainerListViewModel, string>) {
  const name = getValue();

  const linkProps = useSref('.container', {
    id: container.Id,
    nodeName: container.NodeName,
  });

  const settings = useTableSettings<TableSettings>();
  const truncate = settings.truncateContainerName;

  let shortName = name;
  if (truncate > 0) {
    shortName = _.truncate(name, { length: truncate });
  }

  return (
    <a href={linkProps.href} onClick={linkProps.onClick} title={name}>
      {shortName}
    </a>
  );
}
