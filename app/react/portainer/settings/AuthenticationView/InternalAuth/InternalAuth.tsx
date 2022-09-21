import { confirmDestructive } from '@/portainer/services/modal.service/confirm';
import { Settings } from '@/react/portainer/settings/types';

import { FormSectionTitle } from '@@/form-components/FormSectionTitle';

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
  function onSubmit() {
    if (value.RequiredPasswordLength < 10) {
      confirmDestructive({
        title: 'Allow weak passwords?',
        message:
          'You have set an insecure minimum password length. This could leave your system vulnerable to attack, are you sure?',
        buttons: {
          confirm: {
            label: 'Yes',
            className: 'btn-danger',
          },
        },
        callback: function onConfirm(confirmed) {
          if (confirmed) onSaveSettings();
        },
      });
    } else {
      onSaveSettings();
    }
  }

  return (
    <>
      <FormSectionTitle>Information</FormSectionTitle>
      <div className="form-group col-sm-12 text-muted small">
        When using internal authentication, Portainer will encrypt user
        passwords and store credentials locally.
      </div>

      <FormSectionTitle>Password rules</FormSectionTitle>
      <div className="form-group col-sm-12 text-muted small">
        Define minimum length for user-generated passwords.
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
