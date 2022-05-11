import * as kcService from '@/kubernetes/services/kubeconfig.service';
import * as notifications from '@/portainer/services/notifications';
import { confirmKubeconfigSelection } from '@/portainer/services/modal.service/prompt';
import { Environment } from '@/portainer/environments/types';
import { isKubernetesEnvironment } from '@/portainer/environments/utils';
import { trackEvent } from '@/angulartics.matomo/analytics-services';
import { Button } from '@/portainer/components/Button';

interface Props {
  environments?: Environment[];
}

export function KubeconfigButton({ environments }: Props) {
  if (!environments) {
    return null;
  }

  if (!isKubeconfigButtonVisible(environments)) {
    return null;
  }

  return (
    <Button onClick={handleClick}>
      <i className="fas fa-download space-right" /> kubeconfig
    </Button>
  );

  function handleClick() {
    if (!environments) {
      return;
    }

    trackEvent('kubernetes-kubectl-kubeconfig-multi', {
      category: 'kubernetes',
    });

    showKubeconfigModal(environments);
  }
}

function isKubeconfigButtonVisible(environments: Environment[]) {
  if (window.location.protocol !== 'https:') {
    return false;
  }
  return environments.some((env) => isKubernetesEnvironment(env.Type));
}

async function showKubeconfigModal(environments: Environment[]) {
  const kubeEnvironments = environments.filter((env) =>
    isKubernetesEnvironment(env.Type)
  );
  const options = kubeEnvironments.map((environment) => ({
    text: `${environment.Name} (${environment.URL})`,
    value: `${environment.Id}`,
  }));

  let expiryMessage = '';
  try {
    expiryMessage = await kcService.expiryMessage();
  } catch (e) {
    notifications.error('Failed fetching kubeconfig expiry time', e as Error);
  }

  confirmKubeconfigSelection(
    options,
    expiryMessage,
    async (selectedEnvironmentIDs: string[]) => {
      if (selectedEnvironmentIDs.length === 0) {
        notifications.warning('No environment was selected', '');
        return;
      }
      try {
        await kcService.downloadKubeconfigFile(
          selectedEnvironmentIDs.map((id) => parseInt(id, 10))
        );
      } catch (e) {
        notifications.error('Failed downloading kubeconfig file', e as Error);
      }
    }
  );
}
