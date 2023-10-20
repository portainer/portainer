import { object, boolean, string } from 'yup';

export function validationSchema() {
  return object().shape({
    allowSelfSignedCertificates: boolean(),
    envVars: string(),
  });
}
