import { isEdgeEnvironment, isKubernetesEnvironment } from '../utils';
import { Environment, EnvironmentStatus } from '../types';
import { k8sInstallTitles } from '../wizard/EnvironmentsCreationView/WizardK8sInstall/types';

import { KubeConfigureInstructions } from './KubeConfigureInstructions';
import { Microk8sClusterDetails } from './Microk8sClusterDetails';
import { KaaSClusterDetails } from './KaaSClusterDetails';

export function KubeDetails({ environment }: { environment: Environment }) {
  const isKube = isKubernetesEnvironment(environment.Type);
  const isEdge = isEdgeEnvironment(environment.Type);

  return (
    <>
      {isKube &&
        (!isEdge || !!environment.EdgeID) &&
        environment.Status !== EnvironmentStatus.Error && (
          <KubeConfigureInstructions environmentId={environment.Id} />
        )}

      {environment.CloudProvider?.Name.toLowerCase() ===
      k8sInstallTitles.microk8s.toLowerCase() ? (
        <Microk8sClusterDetails environmentId={environment.Id} />
      ) : (
        environment.CloudProvider?.URL && (
          <KaaSClusterDetails info={environment.CloudProvider} />
        )
      )}
    </>
  );
}
