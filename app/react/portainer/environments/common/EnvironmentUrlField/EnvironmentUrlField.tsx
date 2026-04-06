import { Field, useField } from 'formik';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [, meta] = useField('environmentUrl');

  return (
    <FormControl
      label={isAgent ? t('environment_url_field.label_agent') : t('environment_url_field.label_url')}
      errors={meta.error}
      required={optional}
      inputId="environment-url-field"
      tooltip={
        isAgent
          ? t('environment_url_field.tooltip_agent')
          : t('environment_url_field.tooltip_url')
      }
    >
      <Field
        id="environment-url-field"
        name="environmentUrl"
        as={Input}
        placeholder={t('environment_url_field.placeholder', { port: placeholderPort })}
        data-cy="endpointCreate-endpointUrlAgentInput"
        disabled={disabled}
      />
    </FormControl>
  );
}
