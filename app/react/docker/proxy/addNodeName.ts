import { RawAxiosRequestHeaders } from 'axios';

const AgentTargetHeader = 'X-PortainerAgent-Target';

export function addNodeName(
  nodeName?: string,
  headers: RawAxiosRequestHeaders = {}
) {
  if (!nodeName) {
    return headers;
  }

  return {
    ...headers,
    [AgentTargetHeader]: nodeName,
  };
}
