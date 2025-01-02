import { useMutation } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { withError } from '@/react-tools/react-query';

import { buildUrl } from '../../queries/build-url';
import { removeWebhooksForService } from '../../webhooks/removeWebhook';

export function useRemoveServicesMutation(environmentId: EnvironmentId) {
  return useMutation(
    (ids: Array<string>) =>
      promiseSequence(ids.map((id) => () => removeService(environmentId, id))),
    withError('Unable to remove services')
  );
}

export async function removeService(
  environmentId: EnvironmentId,
  serviceId: string
) {
  try {
    await axios.delete(buildUrl(environmentId, serviceId));

    await removeWebhooksForService(environmentId, serviceId);
  } catch (error) {
    throw parseAxiosError(error);
  }
}
