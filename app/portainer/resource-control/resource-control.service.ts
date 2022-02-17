import { UserId } from '@/portainer/users/types';
import { AccessControlFormData } from '@/portainer/components/accessControlForm/model';
import { ResourceControlResponse } from '@/portainer/models/resourceControl/resourceControl';

import axios, { parseAxiosError } from '../services/axios';

import { parseOwnershipParameters } from './helper';
import { OwnershipParameters } from './types';

/**
 * Apply a ResourceControl after Resource creation
 * @param  userId ID of User performing the action
 * @param  accessControlData ResourceControl to apply
 * @param  resourceControl ResourceControl to update
 * @param  subResources SubResources managed by the ResourceControl
 */
export function applyResourceControl(
  userId: UserId,
  accessControlData: AccessControlFormData,
  resourceControl: ResourceControlResponse,
  subResources: (number | string)[] = []
) {
  const ownershipParameters = parseOwnershipParameters(
    userId,
    accessControlData,
    subResources
  );
  return updateResourceControl(resourceControl.Id, ownershipParameters);
}

/**
 * Update a ResourceControl
 * @param resourceControlId ID of involved resource
 * @param ownershipParameters Transient type from view data to payload
 */
async function updateResourceControl(
  resourceControlId: string | number,
  ownershipParameters: OwnershipParameters
) {
  try {
    await axios.put(
      `/resource_controls/${resourceControlId}`,
      ownershipParameters
    );
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}
