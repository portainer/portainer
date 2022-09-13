import { array, number, object, SchemaOf, string } from 'yup';

import { EdgeUpdateSchedule } from '../types';

import { nameValidation } from './NameField';
import { FormValues } from './types';
import { typeValidation } from './UpdateTypeTabs';

export function validation(
  schedules: EdgeUpdateSchedule[],
  currentId?: EdgeUpdateSchedule['id']
): SchemaOf<FormValues> {
  return object({
    groupIds: array().min(1, 'At least one group is required'),
    name: nameValidation(schedules, currentId),
    type: typeValidation(),
    time: number()
      .min(Date.now() / 1000)
      .required(),
    version: string().required(),
  });
}
