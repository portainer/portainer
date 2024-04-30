import { RawAxiosRequestHeaders } from 'axios';

import { agentTargetHeader } from '@/portainer/services/axios';

export function addNodeName(
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
