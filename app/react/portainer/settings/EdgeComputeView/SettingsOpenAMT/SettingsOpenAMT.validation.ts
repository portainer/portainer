import { object, string } from 'yup';

export function validationSchema() {
  return object().shape({
    mpsServer: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
    mpsUser: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
    mpsPassword: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
    domainName: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
    certFileContent: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
    certFileName: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
    certFilePassword: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
  });
}
