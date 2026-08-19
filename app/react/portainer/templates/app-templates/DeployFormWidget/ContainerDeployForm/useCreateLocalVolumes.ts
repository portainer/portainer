import { useMutation } from '@tanstack/react-query';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { createVolume } from '@/react/docker/volumes/queries/useCreateVolume';

export function useCreateLocalVolumes() {
  const environmentId = useEnvironmentId();

  return useMutation(async (count: number) =>
    Promise.all(
      Array.from({ length: count }).map(() =>
        createVolume(environmentId, { Driver: 'local' })
      )
    )
  );
}
