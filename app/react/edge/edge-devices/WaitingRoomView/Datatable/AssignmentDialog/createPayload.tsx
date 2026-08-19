import { EnvironmentRelationsPayload } from '@/react/portainer/environments/queries/useUpdateEnvironmentsRelationsMutation';

import { WaitingRoomEnvironment } from '../../types';

import { FormValues } from './types';
import { isAssignedToGroup } from './utils';

export function createPayload(
  environment: WaitingRoomEnvironment,
  values: FormValues
) {
  const relations: Partial<EnvironmentRelationsPayload> = {};

  if (environment.TagIds.length === 0 || values.overrideTags) {
    relations.tags = values.tags;
  }

  if (environment.EdgeGroups.length === 0 || values.overrideEdgeGroups) {
    relations.edgeGroups = values.edgeGroups;
  }

  if (
    (!isAssignedToGroup(environment) || values.overrideGroup) &&
    values.group
  ) {
    relations.group = values.group;
  }

  return [environment.Id, relations];
}
