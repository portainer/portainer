import { useState } from 'react';

import { useEnvironmentList } from '@/react/portainer/environments/queries';

import { FormSection } from '@@/form-components/FormSection';

import { Environment, EnvironmentId } from '../../../types';

import { EnvironmentTableData } from './types';
import { AssociatedEnvironmentsTable } from './AssociatedEnvironmentsTable';
import { AvailableEnvironmentsTable } from './AvailableEnvironmentsTable';

interface Props {
  /** IDs of currently associated environments */
  associatedEnvironmentIds: Array<EnvironmentId>;
  /** IDs of initially associated environments for tracking unsaved changes */
  initialAssociatedEnvironmentIds: Array<EnvironmentId>;
  /** Called when environment IDs change */
  onChange: (ids: Array<EnvironmentId>) => void;
}

export function AssociatedEnvironmentsSelector({
  associatedEnvironmentIds,
  initialAssociatedEnvironmentIds,
  onChange,
}: Props) {
  // Track full environment objects for display (populated when clicking rows)
  const [environmentCache, setEnvironmentCache] = useState<
    Map<EnvironmentId, EnvironmentTableData>
  >(new Map());

  // Fetch initially associated environments to populate the cache
  const initialEnvsQuery = useEnvironmentList(
    {
      endpointIds: initialAssociatedEnvironmentIds,
    },
    {
      enabled: initialAssociatedEnvironmentIds.length > 0,
    }
  );

  const environmentMap = buildEnvironmentMap(
    environmentCache,
    initialEnvsQuery.environments
  );
  const addedIds = associatedEnvironmentIds.filter(
    (id) => !initialAssociatedEnvironmentIds.includes(id)
  );
  const removedIds = initialAssociatedEnvironmentIds.filter(
    (id) => !associatedEnvironmentIds.includes(id)
  );
  const associatedEnvironments = associatedEnvironmentIds
    .map((id) => environmentMap.get(id))
    .filter((env): env is Environment => env !== undefined);

  return (
    <FormSection title="Associated environments">
      <div className="small text-muted">
        You can select which environment should be part of this group by moving
        them to the associated environments table. Simply click on any
        environment entry to move it from one table to the other.
      </div>

      <div className="flex mt-4 gap-5 items-stretch">
        <div className="w-1/2 flex flex-col">
          <AvailableEnvironmentsTable
            title="Available environments"
            excludeIds={associatedEnvironmentIds}
            includeIds={removedIds}
            onClickRow={handleAddEnvironment}
            data-cy="group-availableEndpoints"
          />
        </div>
        <div className="w-1/2 flex flex-col">
          <AssociatedEnvironmentsTable
            title="Associated environments"
            environments={associatedEnvironments}
            highlightIds={addedIds}
            onClickRow={handleRemoveEnvironment}
            data-cy="group-associatedEndpoints"
          />
        </div>
      </div>
    </FormSection>
  );

  function handleAddEnvironment(env: EnvironmentTableData) {
    if (!associatedEnvironmentIds.includes(env.Id)) {
      setEnvironmentCache((prev) => new Map(prev).set(env.Id, env));
      onChange([...associatedEnvironmentIds, env.Id]);
    }
  }

  function handleRemoveEnvironment(env: EnvironmentTableData) {
    onChange(associatedEnvironmentIds.filter((id) => id !== env.Id));
  }
}

function buildEnvironmentMap(
  cache: Map<EnvironmentId, EnvironmentTableData>,
  envs: Array<Environment> | undefined
): Map<EnvironmentId, EnvironmentTableData> {
  return new Map([
    ...cache.entries(),
    ...(envs ?? []).map(
      (env) => [env.Id, { Name: env.Name, Id: env.Id }] as const
    ),
  ]);
}
