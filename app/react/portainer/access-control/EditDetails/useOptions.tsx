import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { buildOption } from '@/portainer/components/BoxSelector';
import { Team } from '@/react/portainer/users/teams/types';
import { ownershipIcon } from '@/react/docker/components/datatable/createOwnershipColumn';

import { BoxSelectorOption } from '@@/BoxSelector/types';
import { BadgeIcon } from '@@/BadgeIcon';

import { ResourceControlOwnership } from '../types';

const publicOption: BoxSelectorOption<ResourceControlOwnership> = {
  value: ResourceControlOwnership.PUBLIC,
  label: 'Public',
  id: 'access_public',
  description:
    'I want any user with access to this environment to be able to manage this resource',
  icon: <BadgeIcon icon={ownershipIcon(ResourceControlOwnership.PUBLIC)} />,
};

export function useOptions(
  isAdmin: boolean,
  teams?: Team[],
  isPublicVisible = false
) {
  const { t } = useTranslation();
  const [options, setOptions] = useState<
    Array<BoxSelectorOption<ResourceControlOwnership>>
  >([]);

  useEffect(() => {
    const translatedPublicOption: BoxSelectorOption<ResourceControlOwnership> =
      {
        ...publicOption,
        label: t('access_control_form.ownership_public_label'),
        description: t('access_control_form.ownership_public_desc'),
      };

    const opts = isAdmin ? getAdminOptions() : getNonAdminOptions();
    setOptions(isPublicVisible ? [...opts, translatedPublicOption] : opts);

    function getAdminOptions() {
      return [
        buildOption(
          'access_administrators',
          <BadgeIcon
            icon={ownershipIcon(ResourceControlOwnership.ADMINISTRATORS)}
          />,
          t('access_control_form.ownership_admin_label'),
          t('access_control_form.ownership_admin_desc'),
          ResourceControlOwnership.ADMINISTRATORS
        ),
        buildOption(
          'access_restricted',
          <BadgeIcon
            icon={ownershipIcon(ResourceControlOwnership.RESTRICTED)}
          />,
          t('access_control_form.ownership_restricted_label'),
          t('access_control_form.ownership_restricted_desc'),
          ResourceControlOwnership.RESTRICTED
        ),
      ];
    }

    function getNonAdminOptions() {
      return _.compact([
        buildOption(
          'access_private',
          <BadgeIcon icon={ownershipIcon(ResourceControlOwnership.PRIVATE)} />,
          t('access_control_form.ownership_private_label'),
          t('access_control_form.ownership_private_desc'),
          ResourceControlOwnership.PRIVATE
        ),
        teams &&
          teams.length > 0 &&
          buildOption(
            'access_restricted',
            <BadgeIcon
              icon={ownershipIcon(ResourceControlOwnership.RESTRICTED)}
            />,
            t('access_control_form.ownership_restricted_label'),
            teams.length === 1
              ? t('access_control_form.ownership_team_desc', {
                  teamName: teams[0].Name,
                })
              : t('access_control_form.ownership_restricted_desc'),
            ResourceControlOwnership.RESTRICTED
          ),
      ]);
    }
  }, [isAdmin, teams, isPublicVisible, t]);

  return options;
}
