import _ from 'lodash';
import { useEffect, useState, useCallback } from 'react';
import { FormikErrors } from 'formik';

import { ResourceControlOwnership as RCO } from '@/portainer/models/resourceControl/resourceControlOwnership';
import { BoxSelector, buildOption } from '@/portainer/components/BoxSelector';
import { ownershipIcon } from '@/portainer/filters/filters';
import { useUser } from '@/portainer/hooks/useUser';
import { Team } from '@/portainer/teams/types';
import { BoxSelectorOption } from '@/portainer/components/BoxSelector/types';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { SwitchField } from '@/portainer/components/form-components/SwitchField';

import { FormError } from '../form-components/FormError';

import { AccessControlFormData } from './model';
import { UsersField } from './UsersField';
import { TeamsField } from './TeamsField';
import { useLoadState } from './useLoadState';

export interface Props {
  values: AccessControlFormData;
  onChange(values: AccessControlFormData): void;
  hideTitle?: boolean;
  errors?: FormikErrors<AccessControlFormData>;
  formNamespace?: string;
}

export function AccessControlForm({
  values,
  onChange,
  hideTitle,
  errors,
  formNamespace,
}: Props) {
  const { users, teams, isLoading } = useLoadState();

  const { user } = useUser();
  const isAdmin = user?.Role === 1;

  const options = useOptions(isAdmin, teams);

  const handleChange = useCallback(
    (partialValues: Partial<typeof values>) => {
      onChange({ ...values, ...partialValues });
    },

    [values, onChange]
  );

  if (isLoading || !teams || !users) {
    return null;
  }

  return (
    <>
      {!hideTitle && <FormSectionTitle>Access control</FormSectionTitle>}

      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={values.accessControlEnabled}
            name={withNamespace('accessControlEnabled')}
            label="Enable access control"
            tooltip="When enabled, you can restrict the access and management of this resource."
            onChange={(accessControlEnabled) =>
              handleChange({ accessControlEnabled })
            }
          />
        </div>
      </div>

      {values.accessControlEnabled && (
        <>
          <div className="form-group">
            <BoxSelector
              radioName={withNamespace('ownership')}
              value={values.ownership}
              options={options}
              onChange={(ownership) => handleChange({ ownership })}
            />
          </div>
          {values.ownership === RCO.RESTRICTED && (
            <div aria-label="extra-options">
              {isAdmin && (
                <UsersField
                  name={withNamespace('authorizedUsers')}
                  users={users}
                  onChange={(authorizedUsers) =>
                    handleChange({ authorizedUsers })
                  }
                  value={values.authorizedUsers}
                  errors={errors?.authorizedUsers}
                />
              )}

              {(isAdmin || teams.length > 1) && (
                <TeamsField
                  name={withNamespace('authorizedTeams')}
                  teams={teams}
                  overrideTooltip={
                    !isAdmin && teams.length > 1
                      ? 'As you are a member of multiple teams, you can select which teams(s) will be able to manage this resource.'
                      : undefined
                  }
                  onChange={(authorizedTeams) =>
                    handleChange({ authorizedTeams })
                  }
                  value={values.authorizedTeams}
                  errors={errors?.authorizedTeams}
                />
              )}

              {typeof errors === 'string' && (
                <div className="form-group col-md-12">
                  <FormError>{errors}</FormError>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  );

  function withNamespace(name: string) {
    return formNamespace ? `${formNamespace}.${name}` : name;
  }
}

function useOptions(isAdmin: boolean, teams?: Team[]) {
  const [options, setOptions] = useState<Array<BoxSelectorOption<RCO>>>([]);

  useEffect(() => {
    setOptions(isAdmin ? adminOptions() : nonAdminOptions(teams));
  }, [isAdmin, teams]);

  return options;
}

function adminOptions() {
  return [
    buildOption(
      'access_administrators',
      ownershipIcon('administrators'),
      'Administrators',
      'I want to restrict the management of this resource to administrators only',
      RCO.ADMINISTRATORS
    ),
    buildOption(
      'access_restricted',
      ownershipIcon('restricted'),
      'Restricted',
      'I want to restrict the management of this resource to a set of users and/or teams',
      RCO.RESTRICTED
    ),
  ];
}
function nonAdminOptions(teams?: Team[]) {
  return _.compact([
    buildOption(
      'access_private',
      ownershipIcon('private'),
      'Private',
      'I want to this resource to be manageable by myself only',
      RCO.PRIVATE
    ),
    teams &&
      teams.length > 0 &&
      buildOption(
        'access_restricted',
        ownershipIcon('restricted'),
        'Restricted',
        teams.length === 1
          ? `I want any member of my team (${teams[0].Name})  to be able to manage this resource`
          : 'I want to restrict the management of this resource to one or more of my teams',
        RCO.RESTRICTED
      ),
  ]);
}
