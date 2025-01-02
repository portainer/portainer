import { useEnvironmentDeploymentOptions } from '@/react/portainer/environments/queries/useEnvironment';

import { useEnvironmentId } from './useEnvironmentId';

type HideDeploymentOption = 'form' | 'webEditor' | 'fileUpload';

export function useIsDeploymentOptionHidden(
  hideDeploymentOption: HideDeploymentOption
) {
  const environmentId = useEnvironmentId();
  const { data: deploymentOptions } =
    useEnvironmentDeploymentOptions(environmentId);

  if (deploymentOptions) {
    const isDeploymentOptionHidden =
      (hideDeploymentOption === 'form' && deploymentOptions.hideAddWithForm) ||
      (hideDeploymentOption === 'webEditor' &&
        deploymentOptions.hideAddWithForm) ||
      (hideDeploymentOption === 'fileUpload' &&
        deploymentOptions.hideAddWithForm);
    return isDeploymentOptionHidden;
  }

  return false;
}
