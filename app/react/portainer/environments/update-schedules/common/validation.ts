import { array, number, object, SchemaOf, string } from 'yup';

import { EdgeUpdateSchedule, ScheduleType } from '../types';

import { FormValues } from './types';

export function validation(
  schedules: EdgeUpdateSchedule[],
  currentId?: EdgeUpdateSchedule['id']
): SchemaOf<FormValues> {
  return object({
    groupIds: array().min(1, 'At least one group is required'),
    name: string()
      .required('This field is required')
      .test('unique', 'Name must be unique', (value) =>
        schedules.every((s) => s.id === currentId || s.name !== value)
      ),
    type: number()
      .oneOf([ScheduleType.Rollback, ScheduleType.Upgrade])
      .default(ScheduleType.Upgrade),
    time: number()
      .min(Date.now() / 1000)
      .required(),
    version: string().required(),
  });
}
