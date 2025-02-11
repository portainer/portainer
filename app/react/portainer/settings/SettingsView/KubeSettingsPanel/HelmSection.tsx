import { Field, useField } from 'formik';

import { TextTip } from '@@/Tip/TextTip';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';
import { InsightsBox } from '@@/InsightsBox';

export function HelmSection() {
  const [{ name }, { error }] = useField<string>('helmRepositoryUrl');

  return (
    <FormSection title="Helm repository">
      <div className="mb-2">
        <TextTip color="blue">
          You can specify the URL to your own Helm repository here. See the{' '}
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

      <InsightsBox
        header="Disclaimer"
        content={
          <>
            At present Portainer does not support OCI format Helm charts.
            Support for OCI charts will be available in a future release. If you
            would like to provide feedback on OCI support or get access to early
            releases to test this functionality,{' '}
            <a
              href="https://bit.ly/3WVkayl"
              target="_blank"
              rel="noopener noreferrer"
            >
              please get in touch
            </a>
            .
          </>
        }
        className="block w-fit mt-2 mb-1"
      />

      <FormControl label="URL" errors={error} inputId="helm-repo-url">
        <Field
          as={Input}
          id="helm-repo-url"
          data-cy="helm-repo-url-input"
          name={name}
          placeholder="https://kubernetes.github.io/ingress-nginx"
        />
      </FormControl>
    </FormSection>
  );
}
