import { boolean, number, object, SchemaOf } from 'yup';

import { options as asyncIntervalOptions } from '@/react/edge/components/EdgeAsyncIntervalsForm';

import { FormValues } from './types';

const intervals = asyncIntervalOptions.map((option) => option.value);

export function validationSchema(): SchemaOf<FormValues> {
  return object({
    EdgeAgentCheckinInterval: number().required('This field is required.'),
    Edge: object({
      PingInterval: number()
        .required('This field is required.')
        .oneOf(intervals),
      SnapshotInterval: number()
        .required('This field is required.')
        .oneOf(intervals),
      CommandInterval: number()
        .required('This field is required.')
        .oneOf(intervals),
      AsyncMode: boolean().default(false),
    }),
  });
}
