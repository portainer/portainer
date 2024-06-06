import { useField, Field } from 'formik';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { FormControl } from '@@/form-components/FormControl';
import { TextArea } from '@@/form-components/Input/Textarea';
import { SwitchField } from '@@/form-components/SwitchField';

import { useToggledValue } from '../useToggledValue';

export function ScreenBannerFieldset() {
  const [{ name }, { error }] = useField<string>('loginBanner');
  const [isEnabled, setIsEnabled] = useToggledValue('loginBanner');

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            labelClass="col-sm-3 col-lg-2"
            data-cy="logo-banner-switch"
            label="Login screen banner"
            checked={isEnabled}
            name="toggle_login_banner"
            onChange={(checked) => setIsEnabled(checked)}
            featureId={FeatureId.CUSTOM_LOGIN_BANNER}
          />
        </div>

        <div className="col-sm-12 text-muted small mt-2">
          You can set a custom banner that will be shown to all users during
          login.
        </div>
      </div>

      {isEnabled && (
        <FormControl
          label="Details"
          inputId="custom_login_banner"
          errors={error}
          required
        >
          <Field
            as={TextArea}
            name={name}
            rows="5"
            id="custom_login_banner"
            placeholder="Banner details"
          />
        </FormControl>
      )}
    </>
  );
}
