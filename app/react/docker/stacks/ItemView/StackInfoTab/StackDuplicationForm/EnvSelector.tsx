import { useMemo } from 'react';
import { sortBy } from 'lodash';

import { useEnvironmentList } from '@/react/portainer/environments/queries';
import { useGroups } from '@/react/portainer/environments/environment-groups/queries';
import { Environment } from '@/react/portainer/environments/types';
import { EnvironmentGroup } from '@/react/portainer/environments/environment-groups/types';

import {
  PortainerSelect,
  GroupOption,
} from '@@/form-components/PortainerSelect';
import { FormError } from '@@/form-components/FormError';

export function EnvSelector({
  value,
  onChange,
  error,
}: {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  error?: string;
}) {
  const envsQuery = useEnvironmentList();
  const groupsQuery = useGroups();

  const environmentOptions = useMemo(() => {
    if (!envsQuery.environments || !groupsQuery.data) {
      return [];
    }

    return getEnvironmentOptions(groupsQuery.data, envsQuery.environments);
  }, [envsQuery.environments, groupsQuery.data]);

  if (!environmentOptions.length) {
    return null;
  }

  return (
    <div className="form-group">
      <PortainerSelect
        value={value}
        onChange={onChange}
        options={environmentOptions}
        placeholder="Select an environment"
        data-cy="stack-duplicate-environment-select"
      />
      {error && (
        <div className="col-sm-12">
          <FormError>{error}</FormError>
        </div>
      )}
    </div>
  );
}

/**
 * Transforms environments and groups into grouped options for PortainerSelect
 */
export function getEnvironmentOptions(
  groups: EnvironmentGroup[],
  environments: Environment[],
  currentEnvironmentId?: number
): GroupOption<number>[] {
  if (!groups || !environments) {
    return [];
  }

  // Group environments by their GroupId
  const groupedEnvironments = environments.reduce<
    Record<number, Array<{ label: string; value: number }>>
  >((acc, environment) => {
    if (environment.Id === currentEnvironmentId) {
      return acc;
    }

    let groupId = environment.GroupId;
    if (!groups.some((g) => g.Id === groupId)) {
      groupId = -1;
    }

    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push({
      label: environment.Name,
      value: environment.Id,
    });
    return acc;
  }, {});

  return Object.entries(groupedEnvironments).map(([groupId, envOptions]) => {
    const parsedGroupId = parseInt(groupId, 10);
    const group = groups.find((g) => g.Id === parsedGroupId);

    return {
      label: group?.Name || 'Others',
      options: sortBy(envOptions, 'label'),
    };
  });
}
