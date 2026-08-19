import { Job } from '../JobsDatatable/types';

export type CronJob = {
  Id: string;
  Name: string;
  Namespace: string;
  Command: string;
  Schedule: string;
  Timezone: string;
  Suspend: boolean;
  IsSystem?: boolean;
  Jobs?: Job[];
};
