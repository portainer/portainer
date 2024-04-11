import { FormikErrors } from 'formik';

import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import {
  EnvVarsFieldset,
  EnvVarsValue,
} from '@/react/portainer/templates/app-templates/DeployFormWidget/EnvVarsFieldset';
import { TemplateNote } from '@/react/portainer/templates/components/TemplateNote';

export function AppTemplateFieldset({
  template,
  values,
  onChange,
  errors,
}: {
  template: TemplateViewModel;
  values: EnvVarsValue;
  onChange: (value: EnvVarsValue) => void;
  errors?: FormikErrors<EnvVarsValue>;
}) {
  return (
    <>
      <TemplateNote note={template.Note} />
      <EnvVarsFieldset
        options={template.Env || []}
        values={values}
        onChange={onChange}
        errors={errors}
      />
    </>
  );
}
