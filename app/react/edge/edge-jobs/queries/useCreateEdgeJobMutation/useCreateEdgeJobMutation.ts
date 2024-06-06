import { useMutation, useQueryClient } from '@tanstack/react-query';

import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { withInvalidate } from '@/react-tools/react-query';

import { queryKeys } from '../query-keys';

import { createJobFromFile } from './createJobFromFile';
import { createJobFromFileContent } from './createJobFromFileContent';

export function useCreateEdgeJobMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEdgeJob,
    ...withInvalidate(queryClient, [queryKeys.base()]),
  });
}

export type BasePayload = {
  name: string;
  cronExpression: string;
  recurring: boolean;

  edgeGroups: Array<EdgeGroup['Id']>;
  endpoints: Array<EnvironmentId>;
};

export type CreateEdgeJobPayload =
  | {
      method: 'file';
      payload: BasePayload & {
        /** File to upload */
        file: File;
      };
    }
  | {
      method: 'string';
      payload: BasePayload & {
        /** Content of the Job file */
        fileContent: string;
      };
    };

function createEdgeJob({ method, payload }: CreateEdgeJobPayload) {
  switch (method) {
    case 'file':
      return createJobFromFile({
        CronExpression: payload.cronExpression,
        Recurring: payload.recurring,
        Name: payload.name,
        EdgeGroups: payload.edgeGroups,
        Endpoints: payload.endpoints,
        File: payload.file,
      });

    case 'string':
      return createJobFromFileContent({
        cronExpression: payload.cronExpression,
        recurring: payload.recurring,
        name: payload.name,
        edgeGroups: payload.edgeGroups,
        endpoints: payload.endpoints,
        fileContent: payload.fileContent,
      });
    default:
      throw new Error('Invalid method');
  }
}
