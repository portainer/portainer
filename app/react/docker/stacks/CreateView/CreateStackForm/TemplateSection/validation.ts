import { SchemaOf, object, number, array, string } from 'yup';

import { validateYAML } from '@/react/docker/stacks/common/stackYamlValidation';

import { TemplateFormValues } from './types';

export function getTemplateValidationSchema({
  containerNames = [],
}: {
  containerNames: Array<string> | undefined;
}): SchemaOf<TemplateFormValues> {
  return object({
    selectedId: number().required('Template is required'),
    variables: array(
      object({
        key: string().required(),
        value: string().required(),
      })
    ).default([]),
    fileContent: string()
      .required('Template content is required')
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
