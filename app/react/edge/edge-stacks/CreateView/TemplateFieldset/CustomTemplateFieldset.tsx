import { CustomTemplatesVariablesField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { TemplateNote } from '@/react/portainer/templates/components/TemplateNote';
import { useCustomTemplate } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplate';

import { ArrayError } from '@@/form-components/InputList/InputList';

import { Values } from './types';

export function CustomTemplateFieldset({
  errors,
  onChange,
  values,
  templateId,
}: {
  values: Values['variables'];
  onChange: (values: Values['variables']) => void;
  errors: ArrayError<Values['variables']> | undefined;
  templateId: CustomTemplate['Id'];
}) {
  const templateQuery = useCustomTemplate(templateId);

  if (!templateQuery.data) {
    return null;
  }

  const template = templateQuery.data;

  return (
    <>
      <TemplateNote note={template.Note} />

      <CustomTemplatesVariablesField
        onChange={onChange}
        value={values}
        definitions={template.Variables}
        errors={errors}
      />
    </>
  );
}
