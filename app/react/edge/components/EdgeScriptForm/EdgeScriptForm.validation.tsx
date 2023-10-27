import { object, boolean, string } from 'yup';

import { validation as nomadTokenValidation } from './NomadTokenField';

export function validationSchema(isNomadTokenVisible?: boolean) {
  return object().shape({
    allowSelfSignedCertificates: boolean(),
    envVars: string(),
    edgeIdGenerator: string()
      .required('Edge ID Generator is required')
      .test(
        'valid edge id generator',
        'edge id generator cannot be empty',
        (value) => !!(value && value.length)
      ),
    ...nomadValidation(isNomadTokenVisible),
  });
}

function nomadValidation(isNomadTokenVisible?: boolean) {
  if (!isNomadTokenVisible) {
    return {};
  }

  return {
    tlsEnabled: boolean().default(false),
    ...nomadTokenValidation(),
  };
}
