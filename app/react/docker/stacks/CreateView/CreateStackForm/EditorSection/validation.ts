import { object, SchemaOf, string } from 'yup';

import { validateYAML } from '@/react/docker/stacks/common/stackYamlValidation';

import { EditorFormValues } from './types';

export function getEditorValidationSchema({
  containerNames = [],
}: {
  containerNames: Array<string> | undefined;
}): SchemaOf<EditorFormValues> {
  return object({
    fileContent: string()
      .required('Stack file content is required')
      .min(1, 'Stack file content cannot be empty')
      .test('valid-yaml', 'Invalid YAML', function validateYamlTest(value) {
        if (!value) {
          return true;
        }

        const yamlError = validateYAML(value, containerNames, []);

        if (yamlError) {
          return this.createError({ message: yamlError });
        }

        return true;
      }),
  });
}
