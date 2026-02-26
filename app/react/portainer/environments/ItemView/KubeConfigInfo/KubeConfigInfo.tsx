import { Wrench } from 'lucide-react';

import {
  EnvironmentId,
  EnvironmentType,
  EnvironmentStatus,
} from '@/react/portainer/environments/types';
import {
  isKubernetesEnvironment,
  isEdgeEnvironment,
} from '@/react/portainer/environments/utils';
import { InformationPanel } from '@/react/components/InformationPanel';
import { Link } from '@/react/components/Link';
import { Icon } from '@/react/components/Icon';

interface Props {
  environmentId?: EnvironmentId;
  environmentType?: EnvironmentType;
  edgeId?: string;
  status: EnvironmentStatus;
}

export function KubeConfigInfo({
  environmentId,
  environmentType,
  edgeId,
  status,
}: Props) {
  if (!environmentType) {
    return null;
  }

  const isVisible =
    isKubernetesEnvironment(environmentType) &&
    (!isEdgeEnvironment(environmentType) || !!edgeId) &&
    status !== EnvironmentStatus.Down;

  if (!isVisible) {
    return null;
  }

  return (
    <InformationPanel title="Kubernetes features configuration">
      <span className="small text-muted vertical-center">
        <Icon icon={Wrench} mode="primary" />
        <div>
          You should configure the features available in this Kubernetes
          environment in the{' '}
          <Link
            to="kubernetes.cluster.setup"
            params={{ endpointId: environmentId }}
            data-cy="kubernetes-config-link"
          >
            Kubernetes configuration
          </Link>{' '}
          view.
        </div>
      </span>
    </InformationPanel>
  );
}
