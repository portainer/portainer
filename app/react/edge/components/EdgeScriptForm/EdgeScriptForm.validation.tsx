import { object, boolean, string } from 'yup';

export function validationSchema() {
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
  });
}
