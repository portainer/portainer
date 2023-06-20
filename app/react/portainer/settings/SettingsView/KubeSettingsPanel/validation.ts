import { SchemaOf, object, string, boolean, number } from 'yup';

import { isValidUrl } from '@@/form-components/validate-url';

import { FormValues } from './types';

export function validation(): SchemaOf<FormValues> {
  return object().shape({
    helmRepositoryUrl: string()
      .default('')
      .test('valid-url', 'Invalid URL', (value) => !value || isValidUrl(value)),
    kubeconfigExpiry: string().required(),
    globalDeploymentOptions: object().shape({
      hideAddWithForm: boolean().required(),
      perEnvOverride: boolean().required(),
      hideWebEditor: boolean().required(),
      hideFileUpload: boolean().required(),
      requireNoteOnApplications: boolean().required(),
      minApplicationNoteLength: number()
        .typeError('Must be a number')
        .default(0)
        .when('requireNoteOnApplications', {
          is: true,
          then: (schema) =>
            schema
              .required()
              .min(1, 'Value should be between 1 to 9999')
              .max(9999, 'Value should be between 1 to 9999'),
        }),
    }),
  });
}
