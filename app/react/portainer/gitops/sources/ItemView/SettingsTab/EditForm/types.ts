import { boolean as yupBoolean, object, string } from 'yup';

import { intervalValidation } from '../../../components/IntervalField';

export interface SettingsFormValues {
  name: string;
  url: string;
  tlsSkipVerify: boolean;
  authEnabled: boolean;
  username: string;
  password: string;
  pollingEnabled: boolean;
  interval: string;
}

export const validationSchema = object({
  name: string().required('Name is required'),
  url: string().required('Repository URL is required'),
  tlsSkipVerify: yupBoolean().defined(),
  authEnabled: yupBoolean().defined(),
  username: string().when('authEnabled', {
    is: true,
    then: (schema) => schema.required('Username is required'),
    otherwise: (schema) => schema.optional(),
  }),
  password: string().optional(),
  pollingEnabled: yupBoolean().defined(),
  interval: string()
    .defined()
    .when('pollingEnabled', {
      is: true,
      then: () => intervalValidation(),
    }),
});
