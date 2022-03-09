import axios, { parseAxiosError } from '../axios';

interface NodesCountResponse {
  nodes: number;
}

export async function getNodesCount() {
  try {
    const { data } = await axios.get<NodesCountResponse>(buildUrl('nodes'));
    return data.nodes;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

function buildUrl(action?: string) {
  let url = '/status';

  if (action) {
    url += `/${action}`;
  }

  return url;
}
