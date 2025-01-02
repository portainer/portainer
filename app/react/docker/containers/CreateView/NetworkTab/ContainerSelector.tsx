import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Option, PortainerSelect } from '@@/form-components/PortainerSelect';

import { useContainers } from '../../queries/useContainers';
import { ContainerStatus } from '../../types';

export function ContainerSelector({
  onChange,
  value,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const environmentId = useEnvironmentId();

  const containersQuery = useContainers<Array<Option<string>>>(environmentId, {
    filters: { status: [ContainerStatus.Running] },
    select(containers) {
      return containers.map((n) => {
        const name = n.Names[0];

        return { label: name, value: name };
      });
    },
  });

  return (
    <PortainerSelect
      value={value}
      onChange={onChange}
      options={containersQuery.data || []}
      isLoading={containersQuery.isLoading}
      data-cy="docker-container-selector"
    />
  );
}
