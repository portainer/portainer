import { useField, Field } from 'formik';

import { FormSection } from '@@/form-components/FormSection';
import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { SwitchField } from '@@/form-components/SwitchField';

interface Props {
  switchDataCy: string;
  inputDataCy: string;
  disabled?: boolean;
}

export function SecurityFieldset({
  switchDataCy,
  inputDataCy,
  disabled,
}: Props) {
  const [{ value: passwordProtect }, , { setValue: setPasswordProtect }] =
    useField<boolean>('passwordProtect');

  const [{ name }, { error }] = useField<string>('password');

  return (
    <FormSection title="Security settings">
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            name="password-switch"
            labelClass="col-sm-3 col-lg-2"
            label="Password Protect"
            checked={passwordProtect}
            data-cy={switchDataCy}
            onChange={(checked) => setPasswordProtect(checked)}
            disabled={disabled}
          />
        </div>
      </div>

      {passwordProtect && (
        <FormControl
          inputId="password"
          label="Password"
          size="small"
          errors={error}
          required
        >
          <Field
            id="password"
            name={name}
            type="password"
            as={Input}
            data-cy={inputDataCy}
            required
          />
        </FormControl>
      )}
    </FormSection>
  );
}
