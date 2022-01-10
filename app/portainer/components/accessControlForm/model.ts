import { ResourceControlOwnership } from 'Portainer/models/resourceControl/resourceControlOwnership';

import { TeamId } from '@/portainer/teams/types';
import { UserId } from '@/portainer/users/types';

export class AccessControlFormData {
  accessControlEnabled = true;

  ownership = ResourceControlOwnership.PRIVATE;

  authorizedUsers: UserId[] = [];

  authorizedTeams: TeamId[] = [];
}

export function parseFromResourceControl(
  isAdmin: boolean,
  resourceControlOwnership?: ResourceControlOwnership
): AccessControlFormData {
  const formData = new AccessControlFormData();

  if (resourceControlOwnership) {
    let ownership = resourceControlOwnership;
    if (isAdmin && ownership === ResourceControlOwnership.PRIVATE) {
      ownership = ResourceControlOwnership.RESTRICTED;
    }

    let accessControl = formData.accessControlEnabled;
    if (ownership === ResourceControlOwnership.PUBLIC) {
      accessControl = false;
    }

    formData.ownership = ownership;
    formData.accessControlEnabled = accessControl;
  } else if (isAdmin) {
    formData.ownership = ResourceControlOwnership.ADMINISTRATORS;
  }

  return formData;
}
