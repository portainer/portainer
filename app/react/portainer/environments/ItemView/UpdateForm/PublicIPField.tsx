import { useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

export function PublicIPField() {
  const [{ value, onChange }, { error }] = useField('publicUrl');
  return (
    <FormControl
      label="Public IP"
      tooltip="URL or IP address where exposed containers will be reachable. This field is optional and will default to the environment URL."
      inputId="endpoint_public_url"
      errors={error}
    >
      <Input
        id="endpoint_public_url"
        name="publicUrl"
        value={value}
        onChange={onChange}
        placeholder="e.g. 10.0.0.10 or mydocker.mydomain.com"
        data-cy="public-url-input"
      />
    </FormControl>
  );
}
