import { GaugeIcon } from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { Widget } from '@@/Widget';
import { DetailsTable } from '@@/DetailsTable';

import { useAgentNodes } from '../agent/queries/useAgentNodes';
import { useApiVersion } from '../agent/queries/useApiVersion';

import { ClusterVisualizerLink } from './ClusterVisualizerLink';

export function ClusterAgentInfo() {
  const environmentId = useEnvironmentId();

  const apiVersionQuery = useApiVersion(environmentId);

  const nodesCountQuery = useAgentNodes(environmentId, apiVersionQuery.data!, {
    select: (data) => data.length,
    enabled: apiVersionQuery.data !== undefined,
  });

  return (
    <Widget>
      <Widget.Title icon={GaugeIcon} title="Cluster information" />
      <Widget.Body className="!px-5 !py-0">
        <DetailsTable dataCy="cluster-agent-info">
          <DetailsTable.Row label="Nodes in the cluster">
            {nodesCountQuery.data}
          </DetailsTable.Row>

          <ClusterVisualizerLink />
        </DetailsTable>
      </Widget.Body>
    </Widget>
  );
}
