import { useField, Field } from 'formik';

import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';

export function TemplatesUrlSection() {
  const [{ name }, { error }] = useField<string>('templatesUrl');
  return (
    <FormSection title="App Templates">
      <div className="form-group">
        <span className="col-sm-12 text-muted small">
          You can specify the URL to your own template definitions file here.
          See{' '}
          <a
            href="https://docs.portainer.io/advanced/app-templates/build"
            target="_blank"
            rel="noreferrer"
          >
            Portainer documentation
          </a>{' '}
          for more details.
        </span>
      </div>

      <FormControl label="URL" inputId="templates_url" required errors={error}>
        <Field
          as={Input}
          id="templates_url"
          placeholder="https://myserver.mydomain/templates.json"
          required
          data-cy="settings-templateUrl"
          name={name}
        />
      </FormControl>
    </FormSection>
  );
}
