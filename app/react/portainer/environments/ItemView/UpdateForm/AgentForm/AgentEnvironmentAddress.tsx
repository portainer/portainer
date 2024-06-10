import { useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

export function AgentAddressField() {
  const [{ value, onChange }, { error }] = useField('url');

  return (
    <FormControl
      label="Environment address"
      tooltip="The address for the Portainer agent in the format <HOST>:<PORT> or <IP>:<PORT>"
      inputId="endpoint_url"
      errors={error}
    >
      <Input
        id="endpoint_url"
        name="url"
        value={value}
        onChange={onChange}
        placeholder="e.g. 10.0.0.10:2375 or mydocker.mydomain.com:2375"
        data-cy="url-input"
      />
    </FormControl>
  );
}
