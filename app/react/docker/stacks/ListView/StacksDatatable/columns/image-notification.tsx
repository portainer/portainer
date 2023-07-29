import { CellContext } from '@tanstack/react-table';

import { ImageUpToDateTooltip } from '@/react/docker/components/datatables/TableColumnHeaderImageUpToDate';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { isRegularStack } from '../../../view-models/utils';
import { StackImageStatus } from '../../StackImageStatus';
import { DecoratedStack } from '../types';

import { columnHelper } from './helper';

export const imageNotificationColumn = columnHelper.display({
  id: 'imageNotification',
  header: () => (
    <>
      Images up to date
      <ImageUpToDateTooltip />
    </>
  ),
  cell: Cell,
});

function Cell({
  row: { original: item },
}: CellContext<DecoratedStack, unknown>) {
  const environmentId = useEnvironmentId();

  if (!isRegularStack(item)) {
    return null;
  }

  return <StackImageStatus environmentId={environmentId} stackId={item.Id} />;
}
