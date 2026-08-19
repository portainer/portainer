import {
  EnvironmentId,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import { ContainerDetailsViewModel } from '@/docker/models/containerDetails';
import { useEnvironment } from '@/react/portainer/environments/queries/useEnvironment';
import { isoDate } from '@/portainer/filters/filters';
import { RegistryId } from '@/react/portainer/registries/types/registry';
import { isPartOfSwarmService } from '@/docker/helpers/containers';

import { Widget, WidgetBody } from '@@/Widget';
import { DetailsTable } from '@@/DetailsTable';

import { NameRow } from './NameRow';
import { WebhookRow } from './WebhookRow';
import { ActionLinksRow } from './ActionLinksRow';
import { StatusRow } from './StatusRow';

interface Props {
  environmentId: EnvironmentId;
  container: ContainerDetailsViewModel;
  nodeName?: string;
  onSuccessUpdate?(): void;
  registryId?: RegistryId;
}

export function ContainerStatusSection({
  environmentId,
  container,
  nodeName,
  onSuccessUpdate,
  registryId,
}: Props) {
  const environmentQuery = useEnvironment(environmentId);
  const isRunning = container.State?.Running || false;
  const isCreated = container.State?.Status === 'created';
  if (!environmentQuery.data) {
    return null;
  }

  return (
    <Widget>
      <Widget.Title icon="box" title="Container status" />
      <WidgetBody className="no-padding">
        <DetailsTable dataCy="container-status-table">
          <DetailsTable.Row label="ID">{container.Id}</DetailsTable.Row>
          <DetailsTable.Row label="Name">
            <NameRow
              containerId={container.Id || ''}
              containerName={container.Name || ''}
              environmentId={environmentId}
              nodeName={nodeName}
              onSuccess={onSuccessUpdate}
            />
          </DetailsTable.Row>
          {!!container.NetworkSettings?.IPAddress && (
            <DetailsTable.Row label="IP address">
              {container.NetworkSettings.IPAddress}
            </DetailsTable.Row>
          )}
          <DetailsTable.Row label="Status">
            <StatusRow container={container} />
          </DetailsTable.Row>
          <DetailsTable.Row label="Created">
            {isoDate(container.Created)}
          </DetailsTable.Row>
          {isRunning && (
            <DetailsTable.Row label="Start time">
              {isoDate(container.State?.StartedAt)}
            </DetailsTable.Row>
          )}
          {!isRunning && !isCreated && (
            <DetailsTable.Row label="Finished">
              {isoDate(container.State?.FinishedAt)}
            </DetailsTable.Row>
          )}
          {environmentQuery.data.Type !== EnvironmentType.EdgeAgentOnDocker && (
            <WebhookRow
              containerId={container.Id || ''}
              environmentId={environmentId}
              autoRemove={container.HostConfig?.AutoRemove || false}
              onSuccess={onSuccessUpdate}
              registryId={registryId}
              partOfSwarmService={isPartOfSwarmService(container)}
            />
          )}
          <ActionLinksRow containerId={container.Id || ''} />
        </DetailsTable>
      </WidgetBody>
    </Widget>
  );
}
