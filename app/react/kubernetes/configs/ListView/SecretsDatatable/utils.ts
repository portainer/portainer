import { Secret, Pod } from 'kubernetes-types/core/v1';

import { Application } from '@/react/kubernetes/applications/types';
import { applicationIsKind } from '@/react/kubernetes/applications/utils';

// getIsSecretInUse returns true if the secret is referenced by any
// application in the cluster
export function getIsSecretInUse(secret: Secret, applications: Application[]) {
  return applications.some((app) => {
    const appSpec = applicationIsKind<Pod>('Pod', app)
      ? app?.spec
      : app?.spec?.template?.spec;

    const hasEnvVarReference = appSpec?.containers.some((container) =>
      container.env?.some(
        (envVar) =>
          envVar.valueFrom?.secretKeyRef?.name === secret.metadata?.name
      )
    );
    const hasVolumeReference = appSpec?.volumes?.some(
      (volume) => volume.secret?.secretName === secret.metadata?.name
    );

    return hasEnvVarReference || hasVolumeReference;
  });
}
