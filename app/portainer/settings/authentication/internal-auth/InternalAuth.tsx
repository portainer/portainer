import { react2angular } from '@/react-tools/react2angular';
import { confirm } from '@/portainer/services/modal.service/confirm';

import { FormSectionTitle } from '@@/form-components/FormSectionTitle';

import { SaveAuthSettingsButton } from '../components/SaveAuthSettingsButton';
import { Settings } from '../../types';

import { PasswordLengthSlider } from './components/PasswordLengthSlider/PasswordLengthSlider';

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
      confirm({
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

export const InternalAuthAngular = react2angular(InternalAuth, [
  'onSaveSettings',
  'isLoading',
  'value',
  'onChange',
]);
