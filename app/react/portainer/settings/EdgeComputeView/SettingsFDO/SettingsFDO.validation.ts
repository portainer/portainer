import { object, string } from 'yup';

export function validationSchema() {
  return object().shape({
    ownerURL: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
    ownerUsername: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
    ownerPassword: string().when('enabled', {
      is: true,
      then: string().required('Field is required'),
    }),
  });
}
