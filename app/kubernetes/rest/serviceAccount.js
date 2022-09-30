import axios, { parseAxiosError } from '@/portainer/services/axios';

export async function getServiceAccounts(environmentId, namespaceId) {
  try {
    const {
      data: { items },
    } = await axios.get(urlBuilder(environmentId, namespaceId));
    return items;
  } catch (error) {
    throw parseAxiosError(error);
  }
}

function urlBuilder(environmentId, namespaceId) {
  return `endpoints/${environmentId}/kubernetes/api/v1/namespaces/${namespaceId}/serviceaccounts`;
}
