import { object, boolean, string } from 'yup';

import { validation as nomadTokenValidation } from './NomadTokenField';

export function validationSchema(isNomadTokenVisible?: boolean) {
  return object().shape({
    allowSelfSignedCertificates: boolean(),
    envVars: string(),
    ...(isNomadTokenVisible ? nomadTokenValidation() : {}),
  });
}
