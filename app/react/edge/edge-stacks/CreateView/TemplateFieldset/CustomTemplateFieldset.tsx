import { CustomTemplatesVariablesField } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';

import { ArrayError } from '@@/form-components/InputList/InputList';

import { Values } from './types';
import { TemplateNote } from './TemplateNote';

export function CustomTemplateFieldset({
  errors,
  onChange,
  values,
  template,
}: {
  values: Values['variables'];
  onChange: (values: Values['variables']) => void;
  errors: ArrayError<Values['variables']> | undefined;
  template: CustomTemplate;
}) {
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
