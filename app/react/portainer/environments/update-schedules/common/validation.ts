import { array, string, object } from 'yup';

import { parseIsoDate } from '@/portainer/filters/filters';

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
    time: string()
      .required('Scheduled time is required')
      .test(
        'validDate',
        'Scheduled time must be in the future',
        (value) => parseIsoDate(value).valueOf() > Date.now()
      ),
    environments: object().default({}),
  });
}
