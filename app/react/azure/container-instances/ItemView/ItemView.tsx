import { useCurrentStateAndParams } from '@uirouter/react';
import { useQueryClient } from 'react-query';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { AccessControlPanel } from '@/react/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { ResourceControlType } from '@/react/portainer/access-control/types';
import {
  ContainerGroup,
  ResourceGroup,
  Subscription,
} from '@/react/azure/types';
import { useContainerGroup } from '@/react/azure/queries/useContainerGroup';
import { useResourceGroup } from '@/react/azure/queries/useResourceGroup';
import { useSubscription } from '@/react/azure/queries/useSubscription';

import { Input } from '@@/form-components/Input';
import { Widget, WidgetBody } from '@@/Widget';
import { PageHeader } from '@@/PageHeader';
import { FormSectionTitle } from '@@/form-components/FormSectionTitle';
import { FormControl } from '@@/form-components/FormControl';

import { PortsMappingField } from '../CreateView/PortsMappingField';

export function ItemView() {
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const { subscriptionId, resourceGroupId, containerGroupId } = parseId(id);

  const environmentId = useEnvironmentId();

  const queryClient = useQueryClient();

  const subscriptionQuery = useSubscription(environmentId, subscriptionId);
  const resourceGroupQuery = useResourceGroup(
    environmentId,
    subscriptionId,
    resourceGroupId
  );

  const containerQuery = useContainerGroup(
    environmentId,
    subscriptionId,
    resourceGroupId,
    containerGroupId
  );

  if (
    !subscriptionQuery.isSuccess ||
    !resourceGroupQuery.isSuccess ||
    !containerQuery.isSuccess
  ) {
    return null;
  }

  const container = aggregateContainerData(
    subscriptionQuery.data,
    resourceGroupQuery.data,
    containerQuery.data
  );

  return (
    <>
      <PageHeader
        title="Container Instance"
        breadcrumbs={[
          { link: 'azure.containerinstances', label: 'Container instances' },
          { label: container.name },
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody className="form-horizontal">
              <FormSectionTitle>Azure settings</FormSectionTitle>
              <FormControl label="Subscription" inputId="subscription-input">
                <Input
                  name="subscription"
                  id="subscription-input"
                  value={container.subscriptionName}
                  readOnly
                />
              </FormControl>

              <FormControl label="Resource group" inputId="resourceGroup-input">
                <Input
                  name="resourceGroup"
                  id="resourceGroup-input"
                  value={container.resourceGroupName}
                  readOnly
                />
              </FormControl>

              <FormControl label="Location" inputId="location-input">
                <Input
                  name="location"
                  id="location-input"
                  value={container.location}
                  readOnly
                />
              </FormControl>

              <FormSectionTitle>Container configuration</FormSectionTitle>

              <FormControl label="Name" inputId="name-input">
                <Input
                  name="name"
                  id="name-input"
                  readOnly
                  value={container.name}
                />
              </FormControl>

              <FormControl label="Image" inputId="image-input">
                <Input
                  name="image"
                  id="image-input"
                  value={container.imageName}
                  readOnly
                />
              </FormControl>

              <FormControl label="OS" inputId="os-input">
                <Input
                  name="os"
                  id="os-input"
                  readOnly
                  value={container.osType}
                />
              </FormControl>

              <PortsMappingField value={container.ports} readOnly />

              <FormControl label="Public IP" inputId="public-ip">
                <Input
                  name="public-ip"
                  id="public-ip"
                  readOnly
                  value={container.ipAddress}
                />
              </FormControl>

              <FormSectionTitle>Container Resources</FormSectionTitle>

              <FormControl label="CPU" inputId="cpu-input">
                <Input
                  name="cpu"
                  id="cpu-input"
                  type="number"
                  placeholder="1"
                  readOnly
                  value={container.cpu}
                />
              </FormControl>

              <FormControl label="Memory" inputId="cpu-input">
                <Input
                  name="memory"
                  id="memory-input"
                  type="number"
                  placeholder="1"
                  readOnly
                  value={container.memory}
                />
              </FormControl>
            </WidgetBody>
          </Widget>
        </div>
      </div>

      <AccessControlPanel
        onUpdateSuccess={() =>
          queryClient.invalidateQueries([
            'azure',
            environmentId,
            'subscriptions',
            subscriptionId,
            'resourceGroups',
            resourceGroupQuery.data.name,
            'containerGroups',
            containerQuery.data.name,
          ])
        }
        resourceId={id}
        resourceControl={container.resourceControl}
        resourceType={ResourceControlType.ContainerGroup}
        environmentId={environmentId}
      />
    </>
  );
}

function parseId(id: string) {
  const match = id.match(
    /^\/subscriptions\/(.+)\/resourceGroups\/(.+)\/providers\/(.+)\/containerGroups\/(.+)$/
  );

  if (!match) {
    throw new Error('container id is missing details');
  }

  const [, subscriptionId, resourceGroupId, , containerGroupId] = match;

  return { subscriptionId, resourceGroupId, containerGroupId };
}

function aggregateContainerData(
  subscription: Subscription,
  resourceGroup: ResourceGroup,
  containerGroup: ContainerGroup
) {
  const containerInstanceData = aggregateContainerInstance();

  const resourceControl = containerGroup.Portainer?.ResourceControl
    ? new ResourceControlViewModel(containerGroup.Portainer.ResourceControl)
    : undefined;

  return {
    name: containerGroup.name,
    subscriptionName: subscription.displayName,
    resourceGroupName: resourceGroup.name,
    location: containerGroup.location,
    osType: containerGroup.properties.osType,
    ipAddress: containerGroup.properties.ipAddress.ip,
    resourceControl,
    ...containerInstanceData,
  };

  function aggregateContainerInstance() {
    const containerInstanceData = containerGroup.properties.containers[0];

    if (!containerInstanceData) {
      return {
        ports: [],
      };
    }

    const containerInstanceProperties = containerInstanceData.properties;

    const containerPorts = containerInstanceProperties.ports;

    const imageName = containerInstanceProperties.image;

    const ports = containerGroup.properties.ipAddress.ports.map(
      (binding, index) => {
        const port =
          containerPorts && containerPorts[index]
            ? containerPorts[index].port
            : undefined;
        return {
          container: port,
          host: binding.port,
          protocol: binding.protocol,
        };
      }
    );

    return {
      imageName,
      ports,
      cpu: containerInstanceProperties.resources.cpu,
      memory: containerInstanceProperties.resources.memoryInGB,
    };
  }
}
