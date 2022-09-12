import { array, number, object } from 'yup';

import { EdgeUpdateSchedule } from '../types';

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
    time: number()
      .min(Math.floor(Date.now() / 1000), 'Time must be in the future')
      .required(),
    environments: object().default({}),
  });
}
