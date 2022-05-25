import { react2angular } from '@/react-tools/react2angular';

import { useSettings } from '../settings/settings.service';

export function PasswordCheckHint() {
  const settingsQuery = useSettings(
    (settings) => settings.InternalAuthSettings
  );
  const minPasswordLength = settingsQuery.data?.RequiredPasswordLength;

  return (
    <div>
      <p className="text-muted">
        <i
          className="fa fa-exclamation-triangle orange-icon space-right"
          aria-hidden="true"
        />
        The password must be at least {minPasswordLength} characters long.
      </p>
    </div>
  );
}

export const PasswordCheckHintAngular = react2angular(PasswordCheckHint, []);
