import { boolean, object, string } from 'yup';

import { validation as certsValidation } from './TLSFieldset';

export function validation() {
  return object({
    name: string().required('This field is required.'),
    url: string().required('This field is required.'),
    tls: boolean(),
    skipVerify: boolean(),
    ...certsValidation(),
  });
}
