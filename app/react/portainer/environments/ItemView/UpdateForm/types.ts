import { TagId } from '@/portainer/tags/types';
import { EdgeAsyncIntervalsValues } from '@/react/edge/components/EdgeAsyncIntervalsForm';

import { TLSConfig } from '@@/TLSFieldset/types';

import { EnvironmentGroupId } from '../../environment-groups/types';

export interface FormValues {
  name: string;
  url: string;
  publicUrl: string;
  tlsConfig: TLSConfig;
  meta: {
    tagIds: TagId[];
    groupId: EnvironmentGroupId;
  };
  edge: {
    checkInInterval: number;
  } & EdgeAsyncIntervalsValues;
}
