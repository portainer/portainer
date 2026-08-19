import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';
import { isAxiosError } from '@/portainer/services/axios/utils/isAxiosError';

import { buildUrl } from './build-url';

export function useUpgradeEditionMutation() {
  return useMutation(upgradeEdition, {
    ...withError('Unable to upgrade edition'),
  });
}

async function upgradeEdition({ license }: { license: string }) {
  try {
    await axios.post(buildUrl('upgrade'), { license });
  } catch (error) {
    if (!isAxiosError(error)) {
      throw error;
    }

    // if error is because the server disconnected, then everything went well
    if (!error.response || !error.response.status) {
      return;
    }

    throw parseAxiosError(error);
  }
}
