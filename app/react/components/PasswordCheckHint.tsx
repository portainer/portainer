import { usePublicSettings } from '@/react/portainer/settings/queries';

import { Icon } from '@@/Icon';

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
      <p className="text-warning vertical-center">
        <Icon icon="alert-triangle" className="icon-warning" feather />
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
