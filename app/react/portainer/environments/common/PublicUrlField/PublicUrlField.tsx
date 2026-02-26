import { Field, useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

export function PublicUrlField() {
  const [, meta] = useField('publicUrl');

  return (
    <FormControl
      label="Public IP"
      inputId="public-url-field"
      errors={meta.error}
      tooltip="URL or IP address where exposed containers will be reachable. This field is optional and will default to the environment URL."
    >
      <Field
        id="public-url-field"
        name="publicUrl"
        as={Input}
        placeholder="e.g. 10.0.0.10 or mydocker.mydomain.com"
        data-cy="public-url-input"
      />
    </FormControl>
  );
}
