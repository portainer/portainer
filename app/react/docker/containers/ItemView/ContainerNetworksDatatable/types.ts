import { TableMeta } from '@tanstack/react-table';
import { EndpointSettings } from 'docker-types';

export type TableNetwork = EndpointSettings & { id: string; name: string };

export type ContainerNetworkTableMeta = TableMeta<TableNetwork> & {
  table: 'container-networks';
  containerId: string;
};

export function isContainerNetworkTableMeta(
  meta?: TableMeta<TableNetwork>
): meta is ContainerNetworkTableMeta {
  return !!meta && 'table' in meta && meta.table === 'container-networks';
}
