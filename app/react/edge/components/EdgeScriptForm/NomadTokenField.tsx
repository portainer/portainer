import { Field, useFormikContext } from 'formik';
import { string, boolean } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { SwitchField } from '@@/form-components/SwitchField';
import { Input } from '@@/form-components/Input';

import { ScriptFormValues } from './types';

export function NomadTokenField() {
  const { values, setFieldValue, errors } =
    useFormikContext<ScriptFormValues>();

  return (
    <>
      <div className="form-group">
        <div className="col-sm-12">
          <SwitchField
            checked={values.authEnabled}
            onChange={(value) => {
              if (!value) {
                setFieldValue('nomadToken', '');
              }
              setFieldValue('authEnabled', value);
            }}
            label="Nomad Authentication Enabled"
            tooltip="Nomad authentication is only required if you have ACL enabled"
          />
        </div>
      </div>

      {values.authEnabled && (
        <FormControl
          label="Nomad Token"
          inputId="nomad-token-input"
          errors={errors.nomadToken}
        >
          <Field name="nomadToken" as={Input} id="nomad-token-input" />
        </FormControl>
      )}
    </>
  );
}

export function validation() {
  return {
    nomadToken: string().when('authEnabled', {
      is: true,
      then: string().required('Token is required'),
    }),
    authEnabled: boolean(),
  };
}
