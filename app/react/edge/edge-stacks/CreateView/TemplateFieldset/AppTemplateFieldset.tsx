import { FormikErrors } from 'formik';

import { EnvVarsFieldset } from '@/react/edge/templates/AppTemplatesView/EnvVarsFieldset';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';

export function AppTemplateFieldset({
  template,
  values,
  onChange,
  errors,
}: {
  template: TemplateViewModel;
  values: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  errors?: FormikErrors<Record<string, string>>;
}) {
  return (
    <EnvVarsFieldset
      options={template.Env || []}
      value={values}
      onChange={onChange}
      errors={errors}
    />
  );
}
