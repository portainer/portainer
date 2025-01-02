import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useInfoPanelState } from '@/react/hooks/useInfoPanelState';

import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';
import { HelpLink } from '@@/HelpLink';

import { useInfo } from '../proxy/queries/useInfo';

const infoPanelId = 'docker-dashboard-info-01';

export function NonAgentSwarmInfo() {
  const { isVisible, dismiss } = useInfoPanelState(infoPanelId);
  const envId = useEnvironmentId();
  const isManagerQuery = useInfo(envId, {
    select: (info) => !!info.Swarm?.ControlAvailable,
  });
  if (!isVisible || isManagerQuery.isLoading) {
    return null;
  }

  const isManager = isManagerQuery.data;

  return (
    <InformationPanel title="Information" onDismiss={() => dismiss()}>
      <TextTip color="blue">
        {isManager ? (
          <>
            Portainer is connected to a node that is part of a Swarm cluster.
            Some resources located on other nodes in the cluster might not be
            available for management, have a look at{' '}
            <HelpLink
              docLink="/admin/environments/add/swarm/agent"
              target="_blank"
            >
              our agent setup
            </HelpLink>{' '}
            for more details.
          </>
        ) : (
          <>
            Portainer is connected to a worker node. Swarm management features
            will not be available.
          </>
        )}
      </TextTip>
    </InformationPanel>
  );
}
