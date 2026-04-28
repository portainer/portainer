import { useMemo } from 'react';

import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

export function useBaseApiQueryParams(searchTerm: string) {
  return useMemo(
    () => ({
      provisioned: true,
      updateInformation: isBE,
      k8sEnvAdmin: true,
      search: searchTerm || undefined,
    }),
    [searchTerm]
  );
}
