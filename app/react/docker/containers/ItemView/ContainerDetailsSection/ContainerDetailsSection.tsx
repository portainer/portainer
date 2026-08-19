import { List } from 'lucide-react';

import { ContainerDetailsViewModel } from '@/docker/models/containerDetails';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { joinCommand } from '@/docker/filters/utils';

import { DetailsTable } from '@@/DetailsTable';
import { Widget } from '@@/Widget';

import { RestartPolicy } from '../../CreateView/RestartPolicyTab/types';
import { RestartPolicySection } from '../RestartPolicySection/RestartPolicySection';

import { ImageRow } from './ImageRow';
import { PortConfigurationRow } from './PortConfigurationRow';
import { EnvironmentVariablesRow } from './EnvironmentVariablesRow';
import { LabelsRow } from './LabelsRow';
import { SysctlsRow } from './SysctlsRow';
import { SecurityOptRow } from './SecurityOptRow';
import { GpuRow } from './GpuRow';

interface Props {
  environmentId: EnvironmentId;
  container: ContainerDetailsViewModel;
  nodeName?: string;
  onUpdateSuccess?(): void;
}

export function ContainerDetailsSection({
  environmentId,
  container,
  nodeName,
  onUpdateSuccess,
}: Props) {
  const config = container.Config;
  const hostConfig = container.HostConfig;

  if (!config || !hostConfig || !container.Id) {
    return null;
  }

  const restartPolicyName = hostConfig.RestartPolicy?.Name as
    | RestartPolicy
    | undefined;

  return (
    <Widget>
      <Widget.Title icon={List} title="Container details" />
      <Widget.Body>
        <DetailsTable dataCy="container-details-table">
          <ImageRow
            image={config.Image || ''}
            imageHash={container.Image || ''}
            nodeName={nodeName}
          />

          <PortConfigurationRow ports={container.NetworkSettings?.Ports} />

          <DetailsTable.Row label="CMD">
            <code>{joinCommand(config.Cmd)}</code>
          </DetailsTable.Row>

          <DetailsTable.Row label="ENTRYPOINT">
            <code>
              {config.Entrypoint ? joinCommand(config.Entrypoint) : 'null'}
            </code>
          </DetailsTable.Row>

          <EnvironmentVariablesRow variables={config.Env} />

          <LabelsRow labels={config.Labels} />

          <DetailsTable.Row label="Restart policies">
            <RestartPolicySection
              environmentId={environmentId}
              containerId={container.Id}
              nodeName={nodeName}
              name={restartPolicyName}
              maximumRetryCount={hostConfig.RestartPolicy?.MaximumRetryCount}
              onUpdateSuccess={onUpdateSuccess}
            />
          </DetailsTable.Row>

          <SysctlsRow sysctls={hostConfig.Sysctls} />

          <SecurityOptRow securityOpts={hostConfig.SecurityOpt} />

          <GpuRow deviceRequests={hostConfig.DeviceRequests} />
        </DetailsTable>
      </Widget.Body>
    </Widget>
  );
}
