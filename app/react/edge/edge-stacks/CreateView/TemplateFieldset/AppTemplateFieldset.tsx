import { FormikErrors } from 'formik';

import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { useAppTemplate } from '@/react/portainer/templates/app-templates/queries/useAppTemplates';
import { TemplateNote } from '@/react/portainer/templates/components/TemplateNote';
import {
  EnvVarsFieldset,
  EnvVarsValue,
} from '@/react/portainer/templates/app-templates/DeployFormWidget/EnvVarsFieldset';

export function AppTemplateFieldset({
  templateId,
  values,
  onChange,
  errors,
}: {
  templateId: TemplateViewModel['Id'];
  values: EnvVarsValue;
  onChange: (value: EnvVarsValue) => void;
  errors?: FormikErrors<EnvVarsValue>;
}) {
  const templateQuery = useAppTemplate(templateId);
  if (!templateQuery.data) {
    return null;
  }

  const template = templateQuery.data;

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
