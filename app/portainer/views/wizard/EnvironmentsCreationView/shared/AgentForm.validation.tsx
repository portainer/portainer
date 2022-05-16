import { object, string } from 'yup';

export function validation() {
  return object({
    name: string().required('This field is required.'),
    environmentUrl: string().required('This field is required.'),
  });
}
