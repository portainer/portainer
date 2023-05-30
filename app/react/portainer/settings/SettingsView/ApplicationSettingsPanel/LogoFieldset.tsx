import { useField, Field } from 'formik';

import { useIsDemo } from '@/react/portainer/system/useSystemStatus';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';

export function LogoFieldset() {
  const [{ name }, { error }] = useField<string>('logo');
  const [, { value: isEnabled }, { setValue: setIsEnabled }] =
    useField<boolean>('logoEnabled');
  const isDemoQuery = useIsDemo();

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            label="Use custom logo"
            checked={isEnabled}
            name="toggle_logo"
            labelClass="col-sm-2"
            disabled={isDemoQuery.data}
            onChange={(checked) => setIsEnabled(checked)}
          />
        </div>

        {isDemoQuery.data && (
          <div className="col-sm-12 mt-2">
            <span className="small text-muted">
              You cannot use this feature in the demo version of Portainer.
            </span>
          </div>
        )}
      </div>

      {isEnabled && (
        <div>
          <div className="form-group">
            <span className="col-sm-12 text-muted small">
              You can specify the URL to your logo here. For an optimal display,
              logo dimensions should be 155px by 55px.
            </span>
          </div>
          <FormControl label="URL" inputId="logo_url" errors={error} required>
            <Field
              as={Input}
              name={name}
              id="logo_url"
              placeholder="https://mycompany.com/logo.png"
            />
          </FormControl>
        </div>
      )}
    </>
  );
}
