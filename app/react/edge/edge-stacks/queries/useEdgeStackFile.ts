import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EdgeStack } from '../types';

import { buildUrl } from './buildUrl';
import { queryKeys } from './query-keys';

export function useEdgeStackFile(
  id: EdgeStack['Id'],
  { skipErrors, version }: { version?: number; skipErrors?: boolean } = {}
) {
  return useQuery({
    queryKey: queryKeys.file(id, version),
    queryFn: () =>
      getEdgeStackFile(id, version).catch((e) => {
        if (!skipErrors) {
          throw e;
        }

        return '';
      }),
  });
}

interface StackFileResponse {
  StackFileContent: string;
}

export async function getEdgeStackFile(id?: EdgeStack['Id'], version?: number) {
  if (!id) {
    return null;
  }

  try {
    const { data } = await axios.get<StackFileResponse>(buildUrl(id, 'file'), {
      params: { version },
    });
    return data.StackFileContent;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
