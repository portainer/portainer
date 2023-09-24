import { useCallback } from 'react';
import { FormikErrors } from 'formik';

import { useUser } from '@/react/hooks/useUser';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { FormError } from '@@/form-components/FormError';

import { ResourceControlOwnership, AccessControlFormData } from '../types';

import { UsersField } from './UsersField';
import { TeamsField } from './TeamsField';
import { useLoadState } from './useLoadState';
import { AccessTypeSelector } from './AccessTypeSelector';

interface Props {
  values: AccessControlFormData;
  onChange(values: AccessControlFormData): void;
  isPublicVisible?: boolean;
  errors?: FormikErrors<AccessControlFormData>;
  formNamespace?: string;
  environmentId?: EnvironmentId;
}

export function EditDetails({
  values,
  onChange,
  isPublicVisible = false,
  errors,
  formNamespace,
  environmentId,
}: Props) {
  const { user, isAdmin } = useUser();

  const { users, teams, isLoading } = useLoadState(environmentId, isAdmin);
  const handleChange = useCallback(
    (partialValues: Partial<typeof values>) => {
      onChange({ ...values, ...partialValues });
    },

    [values, onChange]
  );

  if (isLoading || !teams || (isAdmin && !users) || !values.authorizedUsers) {
    return null;
  }

  return (
    <>
      <AccessTypeSelector
        onChange={handleChangeOwnership}
        name={withNamespace('ownership')}
        value={values.ownership}
        isAdmin={isAdmin}
        isPublicVisible={isPublicVisible}
        teams={teams}
      />

      {values.ownership === ResourceControlOwnership.RESTRICTED && (
        <div aria-label="extra-options">
          {isAdmin && (
            <UsersField
              name={withNamespace('authorizedUsers')}
              users={users || []}
              onChange={(authorizedUsers) => handleChange({ authorizedUsers })}
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
              onChange={(authorizedTeams) => handleChange({ authorizedTeams })}
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
  );

  function withNamespace(name: string) {
    return formNamespace ? `${formNamespace}.${name}` : name;
  }

  function handleChangeOwnership(ownership: ResourceControlOwnership) {
    let { authorizedTeams, authorizedUsers } = values;

    if (ownership === ResourceControlOwnership.PRIVATE && user) {
      authorizedUsers = [user.Id];
      authorizedTeams = [];
    }

    if (ownership === ResourceControlOwnership.RESTRICTED) {
      authorizedUsers = [];
      authorizedTeams = [];
      // Non admin team leaders/members under only one team can
      // automatically grant the resource access to all members
      // under the team
      if (!isAdmin && teams && teams.length === 1) {
        authorizedTeams = teams.map((team) => team.Id);
      }
    }

    handleChange({ ownership, authorizedTeams, authorizedUsers });
  }
}
