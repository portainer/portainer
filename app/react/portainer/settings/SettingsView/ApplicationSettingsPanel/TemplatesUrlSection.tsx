import { useField, Field } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { useDocsUrl } from '@@/PageHeader/ContextHelp';

// this value is taken from https://github.com/portainer/portainer/blob/develop/api/portainer.go#L1628
const DEFAULT_URL =
  'https://raw.githubusercontent.com/portainer/templates/v3/templates.json';

export function TemplatesUrlSection() {
  const [{ name }, { error }] = useField<string>('templatesUrl');

  const buildTemplateDocUrl = useDocsUrl('/advanced/app-templates/build');

  return (
    <FormSection title="App Templates">
      <div className="form-group">
        <div className="col-sm-12 text-muted small">
          <p>
            You can specify the URL to your own template definitions file here.
            See{' '}
            <a href={buildTemplateDocUrl} target="_blank" rel="noreferrer">
              Portainer documentation
            </a>{' '}
            for more details.
          </p>
          <p>
            The default value is <a href={DEFAULT_URL}>{DEFAULT_URL}</a>
          </p>
        </div>
      </div>

      <FormControl label="URL" inputId="templates_url" errors={error}>
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
