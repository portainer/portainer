import { CellContext } from '@tanstack/react-table';
import { useRouter } from '@uirouter/react';

import { Authorized } from '@/react/hooks/useUser';
import { useDisconnectContainer } from '@/react/docker/networks/queries';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { LoadingButton } from '@@/buttons';

import { TableNetwork, isContainerNetworkTableMeta } from './types';
import { columnHelper } from './helper';

export const actions = columnHelper.display({
  header: 'Actions',
  cell: Cell,
});

function Cell({
  row,
  table: {
    options: { meta },
  },
}: CellContext<TableNetwork, unknown>) {
  const router = useRouter();
  const environmentId = useEnvironmentId();
  const disconnectMutation = useDisconnectContainer();

  return (
    <Authorized authorizations="DockerNetworkDisconnect">
      <LoadingButton
        color="dangerlight"
        data-cy="disconnect-network-button"
        isLoading={disconnectMutation.isLoading}
        loadingText="Leaving network..."
        type="button"
        onClick={handleSubmit}
      >
        Leave network
      </LoadingButton>
    </Authorized>
  );

  function handleSubmit() {
    if (!isContainerNetworkTableMeta(meta)) {
      throw new Error('Invalid row meta');
    }

    disconnectMutation.mutate(
      {
        environmentId,
        networkId: row.original.id,
        containerId: meta.containerId,
      },
      {
        onSuccess() {
          router.stateService.reload();
        },
      }
    );
  }
}
