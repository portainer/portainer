import { ConfigMap, Pod } from 'kubernetes-types/core/v1';

import { Application } from '@/react/kubernetes/applications/types';
import { applicationIsKind } from '@/react/kubernetes/applications/utils';

// getIsConfigMapInUse returns true if the configmap is referenced by any
// application in the cluster
export function getIsConfigMapInUse(
  configMap: ConfigMap,
  applications: Application[]
) {
  return applications.some((app) => {
    const appSpec = applicationIsKind<Pod>('Pod', app)
      ? app?.spec
      : app?.spec?.template?.spec;

    const hasEnvVarReference = appSpec?.containers.some((container) => {
      const valueFromEnv = container.env?.some(
        (envVar) =>
          envVar.valueFrom?.configMapKeyRef?.name === configMap.metadata?.name
      );
      const envFromEnv = container.envFrom?.some(
        (envVar) => envVar.configMapRef?.name === configMap.metadata?.name
      );
      return valueFromEnv || envFromEnv;
    });
    const hasVolumeReference = appSpec?.volumes?.some(
      (volume) => volume.configMap?.name === configMap.metadata?.name
    );

    return hasEnvVarReference || hasVolumeReference;
  });
}
