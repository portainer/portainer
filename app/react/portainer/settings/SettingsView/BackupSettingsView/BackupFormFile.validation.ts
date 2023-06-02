import { object, string, boolean } from 'yup';

export function validationSchema() {
  return object().shape({
    passwordProtect: boolean(),
    password: string().when('passwordProtect', {
      is: true,
      then: (schema) => schema.required('This field is required.'),
    }),
  });
}
