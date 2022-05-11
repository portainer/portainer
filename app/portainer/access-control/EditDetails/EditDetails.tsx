import { useCallback } from 'react';
import { FormikErrors } from 'formik';

import { BoxSelector } from '@/portainer/components/BoxSelector';
import { useUser } from '@/portainer/hooks/useUser';
import { FormError } from '@/portainer/components/form-components/FormError';

import { ResourceControlOwnership, AccessControlFormData } from '../types';

import { UsersField } from './UsersField';
import { TeamsField } from './TeamsField';
import { useLoadState } from './useLoadState';
import { useOptions } from './useOptions';

interface Props {
  values: AccessControlFormData;
  onChange(values: AccessControlFormData): void;
  isPublicVisible?: boolean;
  errors?: FormikErrors<AccessControlFormData>;
  formNamespace?: string;
}

export function EditDetails({
  values,
  onChange,
  isPublicVisible = false,
  errors,
  formNamespace,
}: Props) {
  const { user, isAdmin } = useUser();

  const { users, teams, isLoading } = useLoadState();
  const options = useOptions(isAdmin, teams, isPublicVisible);

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
      <div className="form-group">
        <div className="col-sm-12">
          <BoxSelector
            radioName={withNamespace('ownership')}
            value={values.ownership}
            options={options}
            onChange={(ownership) => handleChangeOwnership(ownership)}
          />
        </div>
      </div>

      {values.ownership === ResourceControlOwnership.RESTRICTED && (
        <div aria-label="extra-options">
          {isAdmin && (
            <UsersField
              name={withNamespace('authorizedUsers')}
              users={users}
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
    }

    handleChange({ ownership, authorizedTeams, authorizedUsers });
  }
}
