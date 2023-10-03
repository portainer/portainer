import { CellContext } from '@tanstack/react-table';

import { ServiceViewModel } from '@/docker/models/service';
import { ImageStatus } from '@/react/docker/components/ImageStatus';
import { hideShaSum } from '@/docker/filters/utils';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { ResourceType } from '@/react/docker/components/ImageStatus/types';
import { ImageUpToDateTooltip } from '@/react/docker/components/datatable/TableColumnHeaderImageUpToDate';

import { columnHelper } from './helper';

export const image = columnHelper.accessor((item) => item.Image, {
  id: 'image',
  header: Header,
  cell: Cell,
});

function Header() {
  return (
    <>
      Image
      <ImageUpToDateTooltip />
    </>
  );
}

function Cell({
  getValue,
  row: { original: item },
}: CellContext<ServiceViewModel, string>) {
  const value = hideShaSum(getValue());
  const environmentId = useEnvironmentId();
  return (
    <>
      <ImageStatus
        resourceId={item.Id || ''}
        resourceType={ResourceType.SERVICE}
        environmentId={environmentId}
      />
      {value}
    </>
  );
}
