import { Field, useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { string } from 'yup';

import { FormControl } from '@@/form-components/FormControl';
import { Input } from '@@/form-components/Input';
import { isValidUrl } from '@@/form-components/validate-url';

interface Props {
  fieldName: string;
  readonly?: boolean;
  required?: boolean;
  tooltip?: string;
}

export function PortainerUrlField({
  fieldName,
  readonly,
  required,
  tooltip,
}: Props) {
  const { t } = useTranslation();
  const [, metaProps] = useField(fieldName);
  const id = `${fieldName}-input`;

  return (
    <FormControl
      label={t('portainer_url_field.label')}
      tooltip={tooltip || t('portainer_url_field.tooltip')}
      required
      errors={metaProps.error}
      inputId={id}
    >
      <Field
        id={id}
        name={fieldName}
        as={Input}
        placeholder={t('portainer_url_field.placeholder')}
        required={required}
        data-cy="endpointCreate-portainerServerUrlInput"
        readOnly={readonly}
      />
    </FormControl>
  );
}

export function validation() {
  return string()
    .required('API server URL is required')
    .test(
      'valid API server URL',
      'The API server URL must be a valid URL (localhost cannot be used)',
      (value) =>
        isValidUrl(
          value,
          (url) => !!url.hostname && url.hostname !== 'localhost'
        )
    );
}

/**
 * Returns a URL that can be used as a default value for the Portainer server API URL
 * based on the current window location.
 * Used for Edge Compute.
 *
 */
export function buildDefaultValue() {
  return `${window.location.protocol}//${window.location.host}`;
}
