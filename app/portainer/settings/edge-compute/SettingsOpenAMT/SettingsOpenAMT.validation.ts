import { object, string } from 'yup';

export function validationSchema() {
  return object().shape({
    MPSServer: string().when('Enabled', {
      is: true,
      then: string().required('Field is required1')
    }),
    MPSUser: string().when('Enabled', {
      is: true,
      then: string().required('Field is required2')
    }),
    MPSPassword: string().when('Enabled', {
      is: true,
      then: string().required('Field is required3')
    }),
    DomainName: string().when('Enabled', {
      is: true,
      then: string().required('Field is required4')
    }),
    CertFileContent: string().when('Enabled', {
      is: true,
      then: string().required('Field is required5')
    }),
    CertFileName: string().when('Enabled', {
      is: true,
      then: string().required('Field is required6')
    }),
    CertFilePassword: string().when('Enabled', {
      is: true,
      then: string().required('Field is required7')
    }),
  });
}
