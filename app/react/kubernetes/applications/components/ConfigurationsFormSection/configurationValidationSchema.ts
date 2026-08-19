import { SchemaOf, array, boolean, mixed, object, string } from 'yup';

import { ConfigurationFormValues } from './types';

export function configurationsValidationSchema(
  validationData?: ConfigurationFormValues[]
): SchemaOf<ConfigurationFormValues[]> {
  return array(
    object({
      overriden: boolean().required(),
      // skip validation for selectedConfiguration because it comes directly from a select dropdown
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectedConfiguration: object({} as any).required(),
      overridenKeys: array(
        object({
          key: string().required(),
          path: string().when('type', {
            is: 'FILESYSTEM',
            then: string()
              .test(
                'No duplicates globally',
                'This path is already used.',
                (path?: string) => {
                  const allPaths = validationData
                    ?.flatMap((configmap) => configmap.overridenKeys)
                    .map((k) => k.path);
                  if (!allPaths) return true;
                  return (
                    allPaths.filter((p) => p === path && p !== '').length <= 1
                  );
                }
              )
              .required('Path is required.'),
          }),
          type: mixed().oneOf(['NONE', 'ENVIRONMENT', 'FILESYSTEM']),
        })
      ).required(),
    })
  );
}
