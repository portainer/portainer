import { RawAxiosRequestHeaders } from 'axios';

import { agentTargetHeader } from '@/portainer/services/axios';

export function addNodeHeader(
  nodeName?: string,
  headers: RawAxiosRequestHeaders = {}
) {
  if (!nodeName) {
    return headers;
  }

  return {
    ...headers,
    [agentTargetHeader]: nodeName,
  };
}
