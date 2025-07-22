import { useRouter } from '@uirouter/react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { DeleteButton } from '@@/buttons/DeleteButton';

import { useUninstallHelmAppMutation } from '../../helmReleaseQueries/useUninstallHelmAppMutation';

export function UninstallButton({
  environmentId,
  releaseName,
  namespace,
}: {
  environmentId: EnvironmentId;
  releaseName: string;
  namespace?: string;
}) {
  const uninstallHelmAppMutation = useUninstallHelmAppMutation(environmentId);
  const router = useRouter();

  return (
    <DeleteButton
      size="medium"
      data-cy="k8sApp-removeHelmChartButton"
      isLoading={uninstallHelmAppMutation.isLoading}
      confirmMessage="Do you want to remove the selected Helm chart? This will delete all resources associated with the Helm chart."
      onConfirmed={handleUninstall}
    >
      Uninstall
    </DeleteButton>
  );

  function handleUninstall() {
    uninstallHelmAppMutation.mutate(
      { releaseName, namespace },
      {
        onSuccess: () => {
          router.stateService.go('kubernetes.applications', {
            endpointId: environmentId,
          });
          notifySuccess('Success', 'Helm chart uninstalled successfully');
        },
      }
    );
  }
}
