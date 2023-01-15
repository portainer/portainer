import { array, object, SchemaOf, string } from 'yup';

import { parseIsoDate } from '@/portainer/filters/filters';

import { EdgeUpdateSchedule, ScheduleType } from '../types';

import { nameValidation } from './NameField';
import { typeValidation } from './ScheduleTypeSelector';
import { FormValues } from './types';

export function validation(
  schedules: EdgeUpdateSchedule[],
  currentId?: EdgeUpdateSchedule['id']
): SchemaOf<FormValues> {
  return object({
    groupIds: array().min(1, 'At least one group is required'),
    name: nameValidation(schedules, currentId),
    type: typeValidation(),
    scheduledTime: string()
      .default('')
      .test('valid', (value) => !value || parseIsoDate(value) !== null),
    version: string()
      .default('')
      .when('type', {
        is: ScheduleType.Update,
        // update type
        then: (schema) => schema.required('Version is required'),
        // rollback
        otherwise: (schema) => schema.required('No rollback options available'),
      }),
  });
}
