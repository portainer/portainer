import { Field, useField } from 'formik';

import { TextTip } from '@@/Tip/TextTip';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';

export function HelmSection() {
  const [{ name }, { error }] = useField<string>('helmRepositoryUrl');

  return (
    <FormSection title="Helm Repository">
      <div className="mb-2">
        <TextTip color="blue">
          You can specify the URL to your own helm repository here. See the{' '}
          <a
            href="https://helm.sh/docs/topics/chart_repository/"
            target="_blank"
            rel="noreferrer"
          >
            official documentation
          </a>{' '}
          for more details.
        </TextTip>
      </div>

      <FormControl label="URL" errors={error} inputId="helm-repo-url">
        <Field
          as={Input}
          id="helm-repo-url"
          name={name}
          placeholder="https://charts.bitnami.com/bitnami"
        />
      </FormControl>
    </FormSection>
  );
}
