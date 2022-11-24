import { object, boolean, string } from 'yup';

import { validation as nomadTokenValidation } from './NomadTokenField';

export function validationSchema(isNomadTokenVisible?: boolean) {
  return object().shape({
    allowSelfSignedCertificates: boolean(),
    envVars: string(),
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
