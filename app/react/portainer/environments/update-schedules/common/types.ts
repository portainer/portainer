import { EdgeGroup } from '@/react/edge/edge-groups/types';

import { ScheduleType } from '../types';

export interface FormValues {
  name: string;
  groupIds: EdgeGroup['Id'][];
  type: ScheduleType;
  version: string;
  scheduledTime: string;
}
