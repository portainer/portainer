import { useField, Field } from 'formik';
import { useTranslation } from 'react-i18next';

import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { FormControl } from '@@/form-components/FormControl';
import { TextArea } from '@@/form-components/Input/Textarea';
import { SwitchField } from '@@/form-components/SwitchField';

import { useToggledValue } from '../useToggledValue';

export function ScreenBannerFieldset() {
  const { t } = useTranslation();
  const [{ name }, { error }] = useField<string>('loginBanner');
  const [isEnabled, setIsEnabled] = useToggledValue('loginBanner');

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            labelClass="col-sm-3 col-lg-2"
            data-cy="logo-banner-switch"
            label={t('settings.app.login_banner')}
            checked={isEnabled}
            name="toggle_login_banner"
            onChange={(checked) => setIsEnabled(checked)}
            featureId={FeatureId.CUSTOM_LOGIN_BANNER}
          />
        </div>

        <div className="col-sm-12 text-muted small mt-2">
          {t('settings.app.banner_description')}
        </div>
      </div>

      {isEnabled && (
        <FormControl
          label={t('settings.app.details')}
          inputId="custom_login_banner"
          errors={error}
          required
        >
          <Field
            as={TextArea}
            name={name}
            rows="5"
            id="custom_login_banner"
            placeholder={t('settings.app.banner_details')}
          />
        </FormControl>
      )}
    </>
  );
}
