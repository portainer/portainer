import _ from 'lodash';
import { useEffect, useState } from 'react';

import { buildOption } from '@/portainer/components/BoxSelector';
import { Team } from '@/react/portainer/users/teams/types';
import { ownershipIcon } from '@/react/docker/components/datatable/createOwnershipColumn';

import { BoxSelectorOption } from '@@/BoxSelector/types';
import { BadgeIcon } from '@@/BadgeIcon';

import { ResourceControlOwnership } from '../types';

function publicOption(
  resourceName: string
): BoxSelectorOption<ResourceControlOwnership> {
  return {
    value: ResourceControlOwnership.PUBLIC,
    label: 'Public',
    id: 'access_public',
    description: `I want any user with access to this ${resourceName} to be able to manage this ${resourceName}`,
    icon: <BadgeIcon icon={ownershipIcon(ResourceControlOwnership.PUBLIC)} />,
  };
}

export function useOptions(
  isAdmin: boolean,
  teams?: Team[],
  isPublicVisible = false,
  resourceName = 'resource'
) {
  const [options, setOptions] = useState<
    Array<BoxSelectorOption<ResourceControlOwnership>>
  >([]);

  useEffect(() => {
    const options = isAdmin
      ? adminOptions(resourceName)
      : nonAdminOptions(teams, resourceName);

    setOptions(
      isPublicVisible ? [...options, publicOption(resourceName)] : options
    );
  }, [isAdmin, teams, isPublicVisible, resourceName]);

  return options;
}

function adminOptions(resourceName: string) {
  return [
    buildOption(
      'access_administrators',
      <BadgeIcon
        icon={ownershipIcon(ResourceControlOwnership.ADMINISTRATORS)}
      />,
      'Administrators',
      `I want to restrict the management of this ${resourceName} to administrators only`,
      ResourceControlOwnership.ADMINISTRATORS
    ),
    buildOption(
      'access_restricted',
      <BadgeIcon icon={ownershipIcon(ResourceControlOwnership.RESTRICTED)} />,
      'Restricted',
      `I want to restrict the management of this ${resourceName} to a set of users and/or teams`,
      ResourceControlOwnership.RESTRICTED
    ),
  ];
}
function nonAdminOptions(teams?: Team[], resourceName = 'resource') {
  return _.compact([
    buildOption(
      'access_private',
      <BadgeIcon icon={ownershipIcon(ResourceControlOwnership.PRIVATE)} />,
      'Private',
      `I want to restrict this ${resourceName} to be manageable by myself only`,
      ResourceControlOwnership.PRIVATE
    ),
    teams &&
      teams.length > 0 &&
      buildOption(
        'access_restricted',
        <BadgeIcon icon={ownershipIcon(ResourceControlOwnership.RESTRICTED)} />,
        'Restricted',
        teams.length === 1 ? (
          <>
            I want any member of my team (<b>{teams[0].Name}</b>) to be able to
            manage this {resourceName}
          </>
        ) : (
          <>
            I want to restrict the management of this {resourceName} to one or
            more of my teams
          </>
        ),
        ResourceControlOwnership.RESTRICTED
      ),
  ]);
}
