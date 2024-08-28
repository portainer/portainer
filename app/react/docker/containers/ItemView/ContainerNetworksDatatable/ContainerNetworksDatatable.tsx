import { useMemo } from 'react';
import { Network } from 'lucide-react';
import { EndpointSettings, NetworkSettings } from 'docker-types/generated/1.41';

import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';
import { ExpandableDatatable } from '@@/datatables/ExpandableDatatable';
import { withMeta } from '@@/datatables/extend-options/withMeta';
import { mergeOptions } from '@@/datatables/extend-options/mergeOptions';

import { ContainerListViewModel } from '../../types';

import { TableNetwork } from './types';
import { buildColumns } from './columns';
import { ConnectNetworkForm } from './ConnectNetworkForm';

const storageKey = 'container-networks';
const store = createPersistedStore(storageKey, 'name');

export function ContainerNetworksDatatable({
  dataset,
  container,
  nodeName,
}: {
  dataset: NetworkSettings['Networks'];
  container: ContainerListViewModel;
  nodeName?: string;
}) {
  const tableState = useTableState(store, storageKey);
  const columns = useMemo(() => buildColumns({ nodeName }), [nodeName]);

  const networks: Array<TableNetwork> = Object.entries(dataset || {})
    .filter(isNetworkDefined)
    .map(([id, network]) => ({
      ...network,
      id,
      name: id,
    }));

  return (
    <ExpandableDatatable<TableNetwork>
      columns={columns}
      dataset={networks}
      settingsManager={tableState}
      title="Connected Networks"
      titleIcon={Network}
      disableSelect
      getRowCanExpand={(row) => !!row.original.GlobalIPv6Address}
      isLoading={!dataset}
      renderSubRow={({ original: item }) => (
        <tr className="datatable-highlighted">
          <td colSpan={2} />
          <td>{item.GlobalIPv6Address}</td>
          <td colSpan={3}>{item.IPv6Gateway || '-'}</td>
        </tr>
      )}
      description={
        <ConnectNetworkForm
          containerId={container.Id}
          nodeName={nodeName}
          selectedNetworks={networks.map((n) => n.id)}
        />
      }
      extendTableOptions={mergeOptions(
        withMeta({
          table: 'container-networks',
          containerId: container.Id,
        })
      )}
      data-cy="container-networks-datatable"
    />
  );
}

function isNetworkDefined(
  value: [string, EndpointSettings | undefined]
): value is [string, EndpointSettings] {
  return value.length > 1 && !!value[1];
}
