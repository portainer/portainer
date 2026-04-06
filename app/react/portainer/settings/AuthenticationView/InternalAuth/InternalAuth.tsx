import { useTranslation } from 'react-i18next';

import { Settings } from '@/react/portainer/settings/types';

import { confirmDestructive } from '@@/modals/confirm';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { buildConfirmButton } from '@@/modals/utils';

import { PasswordLengthSlider } from './PasswordLengthSlider/PasswordLengthSlider';
import { SaveAuthSettingsButton } from './SaveAuthSettingsButton';

export interface Props {
  onSaveSettings(): void;
  isLoading: boolean;
  value: Settings['InternalAuthSettings'];
  onChange(value: number): void;
}

export function InternalAuth({
  onSaveSettings,
  isLoading,
  value,
  onChange,
}: Props) {
  const { t } = useTranslation();

  async function onSubmit() {
    if (value.RequiredPasswordLength < 10) {
      const confirmed = await confirmDestructive({
        title: t('settings.allow_weak_passwords_title'),
        message: t('settings.allow_weak_passwords_message'),
        confirmButton: buildConfirmButton(t('common.yes'), 'danger'),
      });

      if (confirmed) {
        onSaveSettings();
      }
    } else {
      onSaveSettings();
    }
  }

  return (
    <>
      <FormSectionTitle>{t('settings.internal_auth_info_section')}</FormSectionTitle>
      <div className="form-group col-sm-12 text-muted small">
        {t('settings.internal_auth_info_text')}
      </div>

      <FormSectionTitle>{t('settings.password_rules_section')}</FormSectionTitle>
      <div className="form-group col-sm-12 text-muted small">
        {t('settings.password_rules_text')}
      </div>

      <div className="form-group">
        <PasswordLengthSlider
          min={1}
          max={18}
          step={1}
          value={value.RequiredPasswordLength}
          onChange={onChange}
        />
      </div>

      <SaveAuthSettingsButton onSubmit={onSubmit} isLoading={isLoading} />
    </>
  );
}
