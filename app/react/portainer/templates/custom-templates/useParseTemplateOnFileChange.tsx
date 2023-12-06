import { useFormikContext } from 'formik';

import { VariableDefinition } from '../../custom-templates/components/CustomTemplatesVariablesDefinitionField';
import {
  getTemplateVariables,
  intersectVariables,
  isTemplateVariablesEnabled,
} from '../../custom-templates/components/utils';

export function useParseTemplateOnFileChange(
  oldVariables: VariableDefinition[]
) {
  const { setFieldValue, setFieldError } = useFormikContext();

  return handleChangeFileContent;

  function handleChangeFileContent(value: string) {
    setFieldValue(
      'FileContent',
      value,
      isTemplateVariablesEnabled ? !value : true
    );
    parseTemplate(value);
  }

  function parseTemplate(value: string) {
    if (!isTemplateVariablesEnabled || value === '') {
      setFieldValue('Variables', []);
      return;
    }

    const [variables, validationError] = getTemplateVariables(value);
    const isValid = !!variables;

    setFieldError(
      'FileContent',
      validationError ? `Template invalid: ${validationError}` : undefined
    );
    if (isValid) {
      setFieldValue('Variables', intersectVariables(oldVariables, variables));
    }
  }
}
