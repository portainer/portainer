import { object, string } from 'yup';

export function validationSchema() {
  return object().shape({
    OwnerURL: string().when('Enabled', {
      is: true,
      then: string().required('Field is required')
    }),
    OwnerUsername: string().when('Enabled', {
      is: true,
      then: string().required('Field is required')
    }),
    OwnerPassword: string().when('Enabled', {
      is: true,
      then: string().required('Field is required')
    }),
  });
}
