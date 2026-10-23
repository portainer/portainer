import { SwitchField } from '@@/form-components/SwitchField';

import {
  ProviderCredentialFields,
  CredentialValues,
} from './ProviderCredentialFields';

type AuthenticationValues = CredentialValues & { authEnabled: boolean };

type Props = {
  values: AuthenticationValues;
  errors?: { username?: string; password?: string };
  isEditing?: boolean;
  onChange: (changed: Partial<AuthenticationValues>) => void;
  toggleDataCy: string;
};

export function GitAuthentication({
  values,
  errors,
  isEditing,
  onChange,
  toggleDataCy,
}: Props) {
  return (
    <>
      <div className="mb-4">
        <SwitchField
          label="Authentication"
          name="authentication"
          checked={values.authEnabled}
          onChange={(value) => onChange({ authEnabled: value })}
          data-cy={toggleDataCy}
        />
      </div>
      {values.authEnabled && (
        <ProviderCredentialFields
          values={values}
          errors={errors}
          isEditing={isEditing}
          onChange={onChange}
        />
      )}
    </>
  );
}
