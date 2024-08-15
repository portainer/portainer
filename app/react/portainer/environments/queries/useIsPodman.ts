import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { EnvironmentId } from '../types';

import { useEnvironment } from './useEnvironment';

/**
 * useIsPodman returns true if the current environment is using podman as container engine.
 * @returns isPodman boolean, can also be undefined if the environment hasn't loaded yet.
 */
export function useIsPodman(envId?: EnvironmentId) {
  const defaultEnvId = useEnvironmentId();
  const id = envId ?? defaultEnvId;
  const { data: isPodman } = useEnvironment(
    id,
    (env) => env.ContainerEngine === 'podman'
  );
  return isPodman;
}
