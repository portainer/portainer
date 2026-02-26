import { Field, useField } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

export function EnvironmentUrlField({
  placeholderPort = '9001',
  isAgent,
  disabled,
  optional,
}: {
  placeholderPort?: string;
  isAgent?: boolean;
  disabled?: boolean;
  optional?: boolean;
}) {
  const [, meta] = useField('environmentUrl');

  return (
    <FormControl
      label={isAgent ? 'Environment address' : 'Environment URL'}
      errors={meta.error}
      required={optional}
      inputId="environment-url-field"
      tooltip={
        isAgent
          ? 'The address for the Portainer agent in the format <HOST>:<PORT> or <IP>:<PORT>'
          : 'URL or IP address of a Docker host. The Docker API must be exposed over a TCP port. Please refer to the Docker documentation to configure it.'
      }
    >
      <Field
        id="environment-url-field"
        name="environmentUrl"
        as={Input}
        placeholder={`e.g. 10.0.0.10:${placeholderPort} or tasks.portainer_agent:${placeholderPort}`}
        data-cy="endpointCreate-endpointUrlAgentInput"
        disabled={disabled}
      />
    </FormControl>
  );
}
