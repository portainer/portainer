import { boolean, number, object, SchemaOf } from 'yup';

import i18n from '@/i18n';
import { asyncIntervalValues as intervals } from '@/react/edge/components/EdgeAsyncIntervalsForm';

import { FormValues } from './types';

export function validationSchema(): SchemaOf<FormValues> {
  return object({
    EdgeAgentCheckinInterval: number().required(
      i18n.t('validation.field_required')
    ),
    Edge: object({
      PingInterval: number()
        .required(i18n.t('validation.field_required'))
        .oneOf(intervals),
      SnapshotInterval: number()
        .required(i18n.t('validation.field_required'))
        .oneOf(intervals),
      CommandInterval: number()
        .required(i18n.t('validation.field_required'))
        .oneOf(intervals),
      AsyncMode: boolean().default(false),
    }),
  });
}
