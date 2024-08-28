import { useMemo } from 'react';

import { useNetworks } from '@/react/docker/networks/queries/useNetworks';
import { DockerNetwork } from '@/react/docker/networks/types';
import { useIsSwarm } from '@/react/docker/proxy/queries/useInfo';
import { useApiVersion } from '@/react/docker/proxy/queries/useVersion';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsPodman } from '@/react/portainer/environments/queries/useIsPodman';

import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';

export function NetworkSelector({
  onChange,
  additionalOptions = [],
  value,
  hiddenNetworks = [],
}: {
  value: string;
  additionalOptions?: Array<Option<string>>;
  onChange: (value: string) => void;
  hiddenNetworks?: string[];
}) {
  const envId = useEnvironmentId();
  const isPodman = useIsPodman(envId);
  const networksQuery = useNetworksForSelector({
    select(networks) {
      return networks.map((n) => {
        // The name of the 'bridge' network is 'podman' in Podman
        if (n.Name === 'bridge' && isPodman) {
          return { label: 'podman', value: 'podman' };
        }
        return { label: n.Name, value: n.Name };
      });
    },
  });

  const networks = networksQuery.data;

  const options = useMemo(
    () =>
      (networks || [])
        .concat(additionalOptions)
        .filter((n) => !hiddenNetworks.includes(n.value))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [additionalOptions, hiddenNetworks, networks]
  );

  return (
    <PortainerSelect
      value={value}
      onChange={onChange}
      options={options}
      isLoading={networksQuery.isLoading}
      bindToBody
      placeholder="Select a network"
      data-cy="docker-network-selector"
    />
  );
}

export function useNetworksForSelector<T = DockerNetwork[]>({
  select,
}: {
  select?(networks: Array<DockerNetwork>): T;
} = {}) {
  const environmentId = useEnvironmentId();

  const isSwarmQuery = useIsSwarm(environmentId);
  const dockerApiVersion = useApiVersion(environmentId);

  return useNetworks(
    environmentId,
    {
      local: true,
      swarmAttachable: isSwarmQuery && dockerApiVersion >= 1.25,
    },
    {
      select,
    }
  );
}
