import { PasswordField } from './PasswordField';
import { UsernameField } from './UsernameField';

export type CredentialValues = {
  username?: string;
  password?: string;
};

type Props = {
  values: CredentialValues;
  isEditing?: boolean;
  errors?: { username?: string; password?: string };
  onChange: (values: Partial<CredentialValues>) => void;
};

export function ProviderCredentialFields({
  values: { username, password },
  isEditing = false,
  errors,
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-y-4">
      <UsernameField
        value={username || ''}
        onChange={(value) => onChange({ username: value })}
        error={errors?.username}
      />

      <PasswordField
        value={password || ''}
        onChange={(value) => onChange({ password: value })}
        label="Personal Access Token"
        tooltip="Provide a personal access token or password"
        error={errors?.password}
        required={!isEditing}
      />
    </div>
  );
}
