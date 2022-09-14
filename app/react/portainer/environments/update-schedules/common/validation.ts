import { array, object } from 'yup';

import { EdgeUpdateSchedule } from '../types';

import { nameValidation } from './NameField';
import { typeValidation } from './ScheduleTypeSelector';
import { timeValidation } from './ScheduledTimeField';

export function validation(
  schedules: EdgeUpdateSchedule[],
  currentId?: EdgeUpdateSchedule['id']
) {
  return object({
    groupIds: array().min(1, 'At least one group is required'),
    name: nameValidation(schedules, currentId),
    type: typeValidation(),
    time: timeValidation(),
    environments: object().default({}),
  });
}
