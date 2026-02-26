import { useCurrentStateAndParams } from '@uirouter/react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { StackContainersDatatable } from '@/react/docker/stacks/ItemView/StackContainersDatatable';
import { AccessControlPanel } from '@/react/portainer/access-control';
import { useStack } from '@/react/common/stacks/queries/useStack';
import { Stack, StackType } from '@/react/common/stacks/types';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import { queryKeys } from '@/react/common/stacks/queries/query-keys';
import { notifyError } from '@/portainer/services/notifications';

import { PageHeader } from '@@/PageHeader';

import { StackDetails } from './StackDetails';
import { StackServicesDatatable } from './StackServicesDatatable';

export function ItemView() {
  const {
    isExternal,
    isOrphaned,
    isOrphanedRunning,
    isRegular,
    stackName,
    stackId,
    stackType,
  } = useParams();

  const queryClient = useQueryClient();
  const stackQuery = useStack(stackId, { enabled: isRegular || isOrphaned });

  const stack = stackQuery.data;

  const resourceControl = stack?.ResourceControl
    ? new ResourceControlViewModel(stack.ResourceControl)
    : undefined;

  useEffect(() => {
    if (
      isInvalidStackType({
        isExternal,
        isOrphaned,
        isOrphanedRunning,
        stackType,
      })
    ) {
      notifyError('Failure', undefined, 'Invalid type URL parameter.');
    }
  }, [isExternal, isOrphaned, isOrphanedRunning, stackType]);

  return (
    <>
      <PageHeader
        title="Stack details"
        breadcrumbs={[{ label: 'Stacks', link: '^' }, stackName]}
      />
      <StackDetails
        isExternal={isExternal}
        isOrphaned={isOrphaned}
        isOrphanedRunning={isOrphanedRunning}
        isRegular={isRegular}
        stackName={stackName}
        stack={stack}
      />
      {(!isOrphaned || isOrphanedRunning) && (
        <>
          {stackType === StackType.DockerCompose && (
            <StackContainersDatatable stackName={stackName} />
          )}
          {stackType === StackType.DockerSwarm && (
            <StackServicesDatatable name={stackName} />
          )}
        </>
      )}
      {stack && !isOrphaned && (
        <AccessControlPanel
          environmentId={stack.EndpointId}
          resourceId={`${stack.EndpointId}_${stack.Name}`}
          resourceControl={resourceControl}
          resourceType={ResourceControlType.Stack}
          onUpdateSuccess={() =>
            queryClient.invalidateQueries(queryKeys.stack(stackId))
          }
        />
      )}
    </>
  );
}

function isInvalidStackType({
  isExternal,
  isOrphaned,
  isOrphanedRunning,
  stackType,
}: {
  isExternal: boolean;
  isOrphaned: boolean;
  isOrphanedRunning: boolean;
  stackType: StackType | undefined;
}) {
  return (
    (isExternal || (isOrphaned && isOrphanedRunning)) &&
    (!stackType ||
      (stackType !== StackType.DockerSwarm &&
        stackType !== StackType.DockerCompose))
  );
}

function useParams() {
  /*
TODO Check:
why use stack.Name or params.stackName?
why use booleans from params instead of figuring out by name/id
why stack.EndpointID and not params.envId?
*/
  const { params } = useCurrentStateAndParams();
  const isRegular = params.regular === 'true';
  const isExternal = params.external === 'true';
  const isOrphaned = params.orphaned === 'true';
  const isOrphanedRunning = params.orphanedRunning === 'true';
  const stackName = params.name || ('' as string);
  const id = params.id ? (parseInt(params.id, 10) as Stack['Id']) : undefined;
  const type = ['1', '2', '3'].includes(params.type)
    ? (parseInt(params.type, 10) as StackType)
    : undefined;

  return {
    isExternal,
    isRegular,
    isOrphaned,
    isOrphanedRunning,
    stackName,
    stackId: id,
    stackType: type,
  };
}
