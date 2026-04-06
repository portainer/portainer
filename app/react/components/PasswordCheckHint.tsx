import { AlertTriangle, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const settingsQuery = usePublicSettings();
  const minPasswordLength = settingsQuery.data?.RequiredPasswordLength;

  return (
    <div>
      <p className="text-warning vertical-center">
        <Icon icon={AlertTriangle} className="icon-warning" />
        {forceChangePassword &&
          t('password_check.admin_changed_requirements')}
        {t('password_check.min_length', { minPasswordLength })}
        {passwordValid && (
          <Icon icon={Check} className="!ml-1" mode="success" />
        )}
      </p>
    </div>
  );
}
