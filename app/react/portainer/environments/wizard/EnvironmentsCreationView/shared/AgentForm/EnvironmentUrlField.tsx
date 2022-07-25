import { Field, useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

export function EnvironmentUrlField() {
  const [, meta] = useField('environmentUrl');

  return (
    <FormControl
      label="Environment URL"
      errors={meta.error}
      required
      inputId="environment-url-field"
    >
      <Field
        id="environment-url-field"
        name="environmentUrl"
        as={Input}
        placeholder="e.g. 10.0.0.10:9001 or tasks.portainer_agent:9001"
        data-cy="endpointCreate-endpointUrlAgentInput"
      />
    </FormControl>
  );
}
