import { react2angular } from '@/react-tools/react2angular';

import { SaveAuthSettingsButton } from '../components/SaveAuthSettingsButton';

import { PasswordLengthSlider } from './PasswordLengthSlider';

export interface Props {
  onSaveSettings(): void;
  saveButtonState: boolean;
}

export function InternalAuth({ onSaveSettings, saveButtonState }: Props) {
  return (
    <>
      <div className="col-sm-12 form-section-title"> Information </div>
      <div className="form-group col-sm-12 text-muted small">
        {' '}
        When using internal authentication, Portainer will encrypt user
        passwords and store credentials locally.{' '}
      </div>
      <div className="col-sm-12 form-section-title"> Password rules </div>
      <div className="form-group col-sm-12 text-muted small">
        {' '}
        Define minimum length for user-generated passwords.{' '}
      </div>
      <PasswordLengthSlider />
      <SaveAuthSettingsButton
        onSaveSettings={onSaveSettings}
        saveButtonState={saveButtonState}
      />
    </>
  );
}

export const InternalAuthAngular = react2angular(InternalAuth, []);
