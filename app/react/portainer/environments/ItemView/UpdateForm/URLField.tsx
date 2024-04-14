import { useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

export function URLField({ disabled }: { disabled?: boolean }) {
  const [{ value, onChange }, { error }] = useField('url');

  return (
    <FormControl
      label="Environment URL"
      tooltip="URL or IP address of a Docker host. The Docker API must be exposed over a TCP port. Please refer to the Docker documentation to configure it."
      inputId="endpoint_url"
      errors={error}
    >
      <Input
        disabled={disabled}
        name="url"
        id="endpoint_url"
        value={value}
        onChange={onChange}
        placeholder="e.g. 10.0.0.10:2375 or mydocker.mydomain.com:2375"
        data-cy="url-input"
      />
    </FormControl>
  );
}