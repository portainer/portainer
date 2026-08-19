import { useMemo } from 'react';
import _ from 'lodash';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { useStacks } from '@/react/common/stacks/queries/useStacks';
import { useContainers } from '@/react/docker/containers/queries/useContainers';
import { useIsEdgeAdmin } from '@/react/hooks/useUser';

import { getValidationSchema } from './validation';

export function useValidationSchema(environmentId: EnvironmentId) {
  const { isAdmin } = useIsEdgeAdmin();

  const stacksQuery = useStacks();
  const containersQuery = useContainers(environmentId, {
    select: (containers) =>
      containers.flatMap((c) => c.Names).map((name) => _.trimStart(name, '/')),
  });

  const containerNames = containersQuery.data;
  const stacks = stacksQuery.data;

  return useMemo(
    () =>
      getValidationSchema({
        isAdmin,
        environmentId,
        stacks,
        containerNames,
      }),
    [isAdmin, environmentId, stacks, containerNames]
  );
}
