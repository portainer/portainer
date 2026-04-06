import { useField, Field } from 'formik';
import { useTranslation } from 'react-i18next';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';

// this value is taken from https://github.com/portainer/portainer/blob/develop/api/portainer.go#L1628
const DEFAULT_URL =
  'https://raw.githubusercontent.com/portainer/templates/v3/templates.json';

export function TemplatesUrlSection() {
  const { t } = useTranslation();
  const [{ name }, { error }] = useField<string>('templatesUrl');

  return (
    <FormSection title={t('settings.app_templates')}>
      <div className="form-group">
        <div className="col-sm-12 text-muted small">
          <p>
            {t('settings.app_templates_desc')}
          </p>
          <p>
            {t('settings.app_templates_default')} <a href={DEFAULT_URL}>{DEFAULT_URL}</a>
          </p>
        </div>
      </div>

      <FormControl label={t('settings.url')} inputId="templates_url" errors={error}>
        <Field
          as={Input}
          id="templates_url"
          placeholder={DEFAULT_URL}
          data-cy="settings-templateUrl"
          name={name}
        />
      </FormControl>
    </FormSection>
  );
}
