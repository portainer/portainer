import { FormikErrors } from 'formik';

import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';

import { EnvVarsFieldset } from './EnvVarsFieldset';
import { TemplateNote } from './TemplateNote';

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
    <>
      <TemplateNote note={template.Note} />
      <EnvVarsFieldset
        options={template.Env || []}
        value={values}
        onChange={onChange}
        errors={errors}
      />
    </>
  );
}
