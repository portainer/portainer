import { SchemaOf, object, mixed } from 'yup';

import { validateYAML } from '@/react/docker/stacks/common/stackYamlValidation';

import { UploadFormValues } from './types';

export function getUploadValidationSchema({
  containerNames = [],
}: {
  containerNames: Array<string> | undefined;
}): SchemaOf<UploadFormValues> {
  return object({
    file: mixed<File>()
      .required('Stack file is required')
      .test(
        'valid-yaml',
        'Invalid YAML',
        async function validateYamlTest(value) {
          if (!value) {
            return true;
          }

          let fileContent: string;
          try {
            fileContent = await value.text();
          } catch {
            return this.createError({ message: 'Unable to read file' });
          }

          const yamlError = validateYAML(fileContent, containerNames, []);

          if (yamlError) {
            return this.createError({ message: yamlError });
          }

          return true;
        }
      ),
  });
}
