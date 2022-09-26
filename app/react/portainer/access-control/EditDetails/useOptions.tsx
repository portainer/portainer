import _ from 'lodash';
import { useEffect, useState } from 'react';

import { buildOption } from '@/portainer/components/BoxSelector';
import { ownershipIcon } from '@/portainer/filters/filters';
import { Team } from '@/react/portainer/users/teams/types';

import { BoxSelectorOption } from '@@/BoxSelector/types';
import { BadgeIcon } from '@@/BoxSelector/BadgeIcon';

import { ResourceControlOwnership } from '../types';

const publicOption: BoxSelectorOption<ResourceControlOwnership> = {
  value: ResourceControlOwnership.PUBLIC,
  label: 'Public',
  id: 'access_public',
  description:
    'I want any user with access to this environment to be able to manage this resource',
  icon: <BadgeIcon icon={ownershipIcon('public')} />,
};

export function useOptions(
  isAdmin: boolean,
  teams?: Team[],
  isPublicVisible = false
) {
  const [options, setOptions] = useState<
    Array<BoxSelectorOption<ResourceControlOwnership>>
  >([]);

  useEffect(() => {
    const options = isAdmin ? adminOptions() : nonAdminOptions(teams);

    setOptions(isPublicVisible ? [...options, publicOption] : options);
  }, [isAdmin, teams, isPublicVisible]);

  return options;
}

function adminOptions() {
  return [
    buildOption(
      'access_administrators',
      <BadgeIcon icon={ownershipIcon('administrators')} />,
      'Administrators',
      'I want to restrict the management of this resource to administrators only',
      ResourceControlOwnership.ADMINISTRATORS
    ),
    buildOption(
      'access_restricted',
      <BadgeIcon icon={ownershipIcon('restricted')} />,
      'Restricted',
      'I want to restrict the management of this resource to a set of users and/or teams',
      ResourceControlOwnership.RESTRICTED
    ),
  ];
}
function nonAdminOptions(teams?: Team[]) {
  return _.compact([
    buildOption(
      'access_private',
      <BadgeIcon icon={ownershipIcon('private')} />,
      'Private',
      'I want to this resource to be manageable by myself only',
      ResourceControlOwnership.PRIVATE
    ),
    teams &&
      teams.length > 0 &&
      buildOption(
        'access_restricted',
        <BadgeIcon icon={ownershipIcon('restricted')} />,
        'Restricted',
        teams.length === 1
          ? `I want any member of my team (${teams[0].Name})  to be able to manage this resource`
          : 'I want to restrict the management of this resource to one or more of my teams',
        ResourceControlOwnership.RESTRICTED
      ),
  ]);
}
