import { Environment } from '@/react/portainer/environments/types';

import { getDefaultEdgeIntervalsValues } from '../../common/EdgeIntervalsFieldset/types';

import { EdgeEnvironmentFormValues } from './types';

/**
 * Build initial form values from an environment object
 */
export function buildInitialValues(
  environment: Environment
): EdgeEnvironmentFormValues {
  return {
    name: environment.Name,
    publicUrl: environment.PublicURL || '',

    edge: getDefaultEdgeIntervalsValues(),

    meta: {
      groupId: environment.GroupId,
      tagIds: environment.TagIds || [],
    },
  };
}

/**
 * Build the API payload from form values
 * @param values - Form values
 * @param environment - Original environment (for read-only fields like AsyncMode)
 */
export function buildUpdatePayload(
  values: EdgeEnvironmentFormValues,
  environment: Environment
) {
  return {
    Name: values.name,
    PublicURL: values.publicUrl,
    GroupID: values.meta.groupId,
    TagIds: values.meta.tagIds,

    EdgeCheckinInterval: values.edge.checkinInterval,
    Edge: {
      // AsyncMode is read-only, pass through from original environment
      AsyncMode: environment.Edge?.AsyncMode ?? false,
      PingInterval: values.edge.pingInterval,
      SnapshotInterval: values.edge.snapshotInterval,
      CommandInterval: values.edge.commandInterval,
    },
  };
}
