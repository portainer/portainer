import { useCallback, useMemo } from 'react';

import { Stack, StackType } from '@/react/common/stacks/types';
import { isWorkflowManagedStack } from '@/react/common/stacks/isWorkflowManagedStack';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useStacks } from '@/react/common/stacks/queries/useStacks';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Application } from '../ListView/ApplicationsDatatable/types';

export function useIsWorkflowManagedCheck() {
  const environmentId = useEnvironmentId();
  const stacksQuery = useStacks();
  const stackById = useMemo(
    () => buildStackByIdMap(stacksQuery.data, environmentId),
    [stacksQuery.data, environmentId]
  );

  return useCallback(
    (app: Application) => isApplicationWorkflowManaged(app, stackById),
    [stackById]
  );
}

function buildStackByIdMap(
  stacks: Array<Stack> | undefined,
  environmentId: EnvironmentId
) {
  const stackById = new Map<number, Stack>();
  stacks?.forEach((stack) => {
    if (
      stack.EndpointId === environmentId &&
      stack.Type === StackType.Kubernetes
    ) {
      stackById.set(stack.Id, stack);
    }
  });
  return stackById;
}

function isApplicationWorkflowManaged(
  app: Application,
  stackById: Map<number, Stack>
) {
  const stackId = app.StackId ? parseInt(app.StackId, 10) : undefined;
  return !!stackId && isWorkflowManagedStack(stackById.get(stackId));
}
