import { Field, useField } from 'formik';
import { string } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';

interface Props {
  fieldName: string;
  readonly?: boolean;
}

export function validation() {
  return string()
    .test(
      'url',
      'URL should be a valid URI and cannot include localhost',
      (value) => {
        if (!value) {
          return false;
        }
        try {
          const url = new URL(value);
          return url.hostname !== 'localhost';
        } catch {
          return false;
        }
      }
    )
    .required('URL is required');
}

export function PortainerUrlField({ fieldName, readonly }: Props) {
  const [, metaProps] = useField(fieldName);
  const id = `${fieldName}-input`;

  return (
    <FormControl
      label="Portainer server URL"
      tooltip="URL of the Portainer instance that the agent will use to initiate the communications."
      required
      errors={metaProps.error}
      inputId={id}
    >
      <Field
        id={id}
        name={fieldName}
        as={Input}
        placeholder="e.g. 10.0.0.10:9443 or portainer.mydomain.com"
        required
        data-cy="endpointCreate-portainerServerUrlInput"
        readOnly={readonly}
      />
    </FormControl>
  );
}
