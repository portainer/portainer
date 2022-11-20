import { useMutation } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';

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
    throw parseAxiosError(error as Error);
  }
}
