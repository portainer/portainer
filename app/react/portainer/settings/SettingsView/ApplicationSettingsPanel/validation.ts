import { SchemaOf, bool, boolean, number, object, string } from 'yup';

import { isValidUrl } from '@@/form-components/validate-url';

import { Values } from './types';

export function validation(): SchemaOf<Values> {
  return object({
    edgeAgentCheckinInterval: number().required(),
    enableTelemetry: bool().required(),
    loginBannerEnabled: boolean().default(false),
    loginBanner: string()
      .default('')
      .when('loginBannerEnabled', {
        is: true,
        then: (schema) =>
          schema.required('Login banner is required when enabled'),
      }),
    logoEnabled: boolean().default(false),
    logo: string()
      .default('')
      .when('logoEnabled', {
        is: true,
        then: (schema) =>
          schema
            .required('Logo url is required when enabled')
            .test('valid-url', 'Must be a valid URL', (value) =>
              isValidUrl(value)
            ),
      }),
    snapshotInterval: string().required('Snapshot interval is required'),
    templatesUrl: string()
      .required('Templates URL is required')
      .test('valid-url', 'Must be a valid URL', (value) => isValidUrl(value)),
  });
}
