import { SchemaOf, object, string, boolean, number } from 'yup';

import { isValidUrl } from '@@/form-components/validate-url';

import { FormValues } from './types';

export function validation(): SchemaOf<FormValues> {
  return object().shape({
    helmRepositoryURL: string()
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
        .default(0)
        .when('requireNoteOnApplications', {
          is: true,
          then: number().required(),
        }),
    }),
  });
}
