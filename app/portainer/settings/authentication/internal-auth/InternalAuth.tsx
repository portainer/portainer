import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { react2angular } from '@/react-tools/react2angular';

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
          min={8}
          max={18}
          step={1}
          value={value.RequiredPasswordLength}
          onChange={onChange}
        />
      </div>

      <SaveAuthSettingsButton onSubmit={onSaveSettings} isLoading={isLoading} />
    </>
  );
}

export const InternalAuthAngular = react2angular(InternalAuth, [
  'onSaveSettings',
  'isLoading',
  'value',
  'onChange',
]);
