import { useCurrentStateAndParams } from '@uirouter/react';

import { useContainer } from '@/react/docker/containers/queries/container';

import { InformationPanel } from '@@/InformationPanel';
import { TextTip } from '@@/Tip/TextTip';
import { Link } from '@@/Link';

export function LogView() {
  const {
    params: { endpointId: environmentId, id: containerId },
  } = useCurrentStateAndParams();

  const containerQuery = useContainer(environmentId, containerId);
  if (!containerQuery.data || containerQuery.isLoading) {
    return null;
  }

  const logsEnabled =
    containerQuery.data.HostConfig?.LogConfig?.Type && // if a portion of the object path doesn't exist, logging is likely disabled
    containerQuery.data.HostConfig.LogConfig.Type !== 'none'; // if type === none logging is disabled

  return <>{!logsEnabled && <LogsDisabledInfoPanel />}</>;
}

function LogsDisabledInfoPanel() {
  const {
    params: { id: containerId, nodeName },
  } = useCurrentStateAndParams();

  return (
    <InformationPanel>
      <TextTip color="blue">
        Logging is disabled for this container. If you want to re-enable
        logging, please{' '}
        <Link
          to="docker.containers.new"
          params={{ from: containerId, nodeName }}
        >
          redeploy your container
        </Link>{' '}
        and select a logging driver in the &quot;Command & logging&quot; panel.
      </TextTip>
    </InformationPanel>
  );
}
