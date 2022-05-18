import { Field, useField } from 'formik';

import { FormControl } from '@/portainer/components/form-components/FormControl';
import { Input } from '@/portainer/components/form-components/Input';

export function EnvironmentUrlField() {
  const [, meta] = useField('environmentUrl');

  return (
    <FormControl
      label="Environment URL"
      tooltip="URL or IP address of a Docker host. The Docker API must be exposed over a TCP port. Please refer to the Docker documentation to configure it."
      errors={meta.error}
      required
    >
      <Field
        name="environmentUrl"
        as={Input}
        placeholder="e.g. 10.0.0.10:9001 or tasks.portainer_agent:9001"
        data-cy="endpointCreate-endpointUrlAgentInput"
      />
    </FormControl>
  );
}
