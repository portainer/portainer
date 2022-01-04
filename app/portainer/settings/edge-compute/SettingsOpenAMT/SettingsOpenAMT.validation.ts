import { object, string } from 'yup';

export function validationSchema() {
  return object().shape({
    MPSServer: string().when('Enabled', {
      is: true,
      then: string().required('Field is required')
    }),
    MPSUser: string().when('Enabled', {
      is: true,
      then: string().required('Field is required')
    }),
    MPSPassword: string().when('Enabled', {
      is: true,
      then: string().required('Field is required')
    }),
    DomainName: string().when('Enabled', {
      is: true,
      then: string().required('Field is required')
    }),
    CertFileText: string().when('Enabled', {
      is: true,
      then: string().required('Field is required')
    }),
    CertPassword: string().when('Enabled', {
      is: true,
      then: string().required('Field is required')
    }),
  });
}
