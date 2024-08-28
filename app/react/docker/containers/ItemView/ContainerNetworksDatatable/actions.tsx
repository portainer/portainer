import { CellContext } from '@tanstack/react-table';
import { useRouter } from '@uirouter/react';

import { Authorized } from '@/react/hooks/useUser';
import { useDisconnectContainer } from '@/react/docker/networks/queries/useDisconnectContainerMutation';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';

import { TableNetwork, isContainerNetworkTableMeta } from './types';
import { columnHelper } from './helper';

export function buildActions({ nodeName }: { nodeName?: string } = {}) {
  return columnHelper.display({
    header: 'Actions',
    cell: Cell,
  });

  function Cell({
    row: {
      original: { id: networkId },
    },
    table: {
      options: { meta },
    },
  }: CellContext<TableNetwork, unknown>) {
    const router = useRouter();
    const environmentId = useEnvironmentId();
    const disconnectMutation = useDisconnectContainer({
      environmentId,
      networkId,
    });

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
          containerId: meta.containerId,
          nodeName,
        },
        {
          onSuccess() {
            notifySuccess('Container successfully disconnected', networkId);
            router.stateService.reload();
          },
        }
      );
    }
  }
}
