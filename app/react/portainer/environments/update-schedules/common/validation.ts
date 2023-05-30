import { array, object, SchemaOf, string, number } from 'yup';

import { parseIsoDate } from '@/portainer/filters/filters';
import { EdgeGroup } from '@/react/edge/edge-groups/types';

import { EdgeUpdateSchedule, ScheduleType } from '../types';

import { nameValidation } from './NameField';
import { typeValidation } from './ScheduleTypeSelector';
import { FormValues } from './types';

export function validation(
  schedules: EdgeUpdateSchedule[],
  edgeGroups: Array<EdgeGroup> | undefined,
  currentId?: EdgeUpdateSchedule['id']
): SchemaOf<FormValues> {
  return object({
    groupIds: array()
      .of(number().default(0))
      .min(1, 'At least one group is required')
      .test(
        'At least one group must have endpoints',
        (groupIds) =>
          !!(
            groupIds &&
            edgeGroups &&
            groupIds?.flatMap(
              (id) => edgeGroups?.find((group) => group.Id === id)?.Endpoints
            ).length > 0
          )
      ),
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
    registryId: number().default(0),
  });
}
