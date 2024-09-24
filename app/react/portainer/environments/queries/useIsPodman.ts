import { ContainerEngine, EnvironmentId } from '../types';

import { useEnvironment } from './useEnvironment';

/**
 * useIsPodman returns true if the current environment is using podman as container engine.
 * @returns isPodman boolean, can also be undefined if the environment hasn't loaded yet.
 */
export function useIsPodman(envId: EnvironmentId) {
  const { data: isPodman } = useEnvironment(
    envId,
    (env) => env.ContainerEngine === ContainerEngine.Podman
  );
  return isPodman;
}
