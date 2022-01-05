import { object, string } from 'yup';

export function validationSchema() {
  return object().shape({
    mpsServer: string().when('enabled', {
      is: true,
      then: string().required('Field is required1'),
    }),
    mpsUser: string().when('enabled', {
      is: true,
      then: string().required('Field is required2'),
    }),
    mpsPassword: string().when('enabled', {
      is: true,
      then: string().required('Field is required3'),
    }),
    domainName: string().when('enabled', {
      is: true,
      then: string().required('Field is required4'),
    }),
    certFileContent: string().when('enabled', {
      is: true,
      then: string().required('Field is required5'),
    }),
    certFileName: string().when('enabled', {
      is: true,
      then: string().required('Field is required6'),
    }),
    certFilePassword: string().when('enabled', {
      is: true,
      then: string().required('Field is required7'),
    }),
  });
}
