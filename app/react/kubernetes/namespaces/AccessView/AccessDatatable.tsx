import { UserX } from 'lucide-react';

import { name } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/columns/name';
import { type } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/columns/type';
import { Access } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/types';
import { RemoveAccessButton } from '@/react/portainer/access-control/AccessManagement/AccessDatatable/RemoveAccessButton';

import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { Datatable } from '@@/datatables';

const tableKey = 'kubernetes_resourcepool_access';
const columns = [name, type];
const store = createPersistedStore(tableKey);

export function NamespaceAccessDatatable({
  dataset,
  onRemove,
}: {
  dataset?: Array<Access>;
  onRemove(items: Array<Access>): void;
}) {
  const tableState = useTableState(store, tableKey);

  return (
    <Datatable
      data-cy="kube-namespace-access-datatable"
      title="Namespace Access"
      titleIcon={UserX}
      dataset={dataset || []}
      isLoading={!dataset}
      columns={columns}
      settingsManager={tableState}
      renderTableActions={(selectedItems) => (
        <RemoveAccessButton items={selectedItems} onClick={onRemove} />
      )}
    />
  );
}
