import { Field, useField } from 'formik';
import { useTranslation } from 'react-i18next';

import { TextTip } from '@@/Tip/TextTip';
import { FormControl } from '@@/form-components/FormControl';
import { FormSection } from '@@/form-components/FormSection';
import { Input } from '@@/form-components/Input';

export function HelmSection() {
  const { t } = useTranslation();
  const [{ name }, { error }] = useField<string>('helmRepositoryUrl');

  return (
    <FormSection title={t('settings.helm_repo_title')}>
      <div className="mb-2">
        <TextTip color="blue">
          {t('settings.helm_repo_desc')}
        </TextTip>
      </div>

      <FormControl label={t('settings.url')} errors={error} inputId="helm-repo-url">
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
