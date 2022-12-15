import { array, object, string } from 'yup';

import { EdgeUpdateSchedule, ScheduleType } from '../types';

import { nameValidation } from './NameField';
import { typeValidation } from './ScheduleTypeSelector';

export function validation(
  schedules: EdgeUpdateSchedule[],
  currentId?: EdgeUpdateSchedule['id']
) {
  return object({
    groupIds: array().min(1, 'At least one group is required'),
    name: nameValidation(schedules, currentId),
    type: typeValidation(),
    // time: number()
    //   .min(Date.now() / 1000)
    //   .required(),
    version: string().when('type', {
      is: ScheduleType.Update,
      // update type
      then: (schema) => schema.required('Version is required'),
      // rollback
      otherwise: (schema) => schema.required('No rollback options available'),
    }),
  });
}
