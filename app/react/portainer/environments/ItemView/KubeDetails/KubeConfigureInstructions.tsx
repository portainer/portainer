import { Wrench } from 'lucide-react';

import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';

import { EnvironmentId } from '../../types';

export function KubeConfigureInstructions({
  environmentId,
}: {
  environmentId: EnvironmentId;
}) {
  return (
    <InformationPanel title="Kubernetes features configuration">
      <TextTip icon={Wrench} color="blue">
        You should configure the features available in this Kubernetes
        environment in the{' '}
        <Link
          to="kubernetes.cluster.setup"
          params={{ endpointId: environmentId }}
          data-cy="kube-configure-instructions-link"
        >
          Kubernetes configuration
        </Link>{' '}
        view.
      </TextTip>
    </InformationPanel>
  );
}
