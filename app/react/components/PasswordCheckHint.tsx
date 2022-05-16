import { usePublicSettings } from '@/portainer/settings/queries';

interface Props {
  passwordValid: boolean;
  forceChangePassword?: boolean;
}

export function PasswordCheckHint({
  passwordValid,
  forceChangePassword,
}: Props) {
  const settingsQuery = usePublicSettings();
  const minPasswordLength = settingsQuery.data?.RequiredPasswordLength;

  return (
    <div>
      <p className="text-muted">
        <i
          className="fa fa-exclamation-triangle orange-icon space-right"
          aria-hidden="true"
        />
        {forceChangePassword &&
          'An administrator has changed your password requirements, '}
        The password must be at least {minPasswordLength} characters long.
        {passwordValid && (
          <i className="fa fa-check green-icon space-left" aria-hidden="true" />
        )}
      </p>
    </div>
  );
}
