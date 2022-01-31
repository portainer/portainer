import { useCurrentStateAndParams } from '@uirouter/react';
import { useQueryClient } from 'react-query';

import { FormControl } from '@/portainer/components/form-components/FormControl';
import { FormSectionTitle } from '@/portainer/components/form-components/FormSectionTitle';
import { PageHeader } from '@/portainer/components/PageHeader';
import { Widget, WidgetBody } from '@/portainer/components/widget';
import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { r2a } from '@/react-tools/react2angular';
import { Input } from '@/portainer/components/form-components/Input';
import { AccessControlPanel } from '@/portainer/access-control/AccessControlPanel/AccessControlPanel';
import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';
import { ResourceControlType } from '@/portainer/access-control/types';

import {
  useResourceGroup,
  useSubscription,
  useContainerGroup,
} from '../queries';

import { PortsMappingField } from './CreateContainerInstanceForm/PortsMappingField';

export function ContainerInstanceView() {
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const { subscriptionId, resourceGroupId, containerGroupId } = parseId(id);

  const environmentId = useEnvironmentId();

  const queryClient = useQueryClient();

  const subscription = useSubscription(environmentId, subscriptionId);
  const resourceGroup = useResourceGroup(
    environmentId,
    subscriptionId,
    resourceGroupId
  );

  const container = useContainerGroup(
    environmentId,
    subscriptionId,
    resourceGroupId,
    containerGroupId
  );

  if (
    !subscription.isSuccess ||
    !resourceGroup.isSuccess ||
    !container.isSuccess
  ) {
    return null;
  }

  const containerInstanceData = container.data.properties.containers[0];
  const containerPorts = containerInstanceData.properties.ports;

  const ports = container.data.properties.ipAddress.ports.map(
    (binding, index) => {
      const port = containerPorts[index]
        ? containerPorts[index].port
        : undefined;
      return {
        container: port,
        host: binding.port,
        protocol: binding.protocol,
      };
    }
  );

  return (
    <>
      <PageHeader
        title="Container Instance"
        breadcrumbs={[
          { link: 'azure.containerinstances', label: 'Container instances' },
          { label: container.data.name },
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
                  value={subscription.data.displayName}
                  readOnly
                />
              </FormControl>

              <FormControl label="Resource group" inputId="resourceGroup-input">
                <Input
                  name="resourceGroup"
                  id="resourceGroup-input"
                  value={resourceGroup.data.name}
                  readOnly
                />
              </FormControl>

              <FormControl label="Location" inputId="location-input">
                <Input
                  name="location"
                  id="location-input"
                  value={container.data.location}
                  readOnly
                />
              </FormControl>

              <FormSectionTitle>Container configuration</FormSectionTitle>

              <FormControl label="Name" inputId="name-input">
                <Input
                  name="name"
                  id="name-input"
                  readOnly
                  value={container.data.name}
                />
              </FormControl>

              <FormControl label="Image" inputId="image-input">
                <Input
                  name="image"
                  id="image-input"
                  value={
                    container.data.properties.containers[0].properties.image
                  }
                  readOnly
                />
              </FormControl>

              <FormControl label="OS" inputId="os-input">
                <Input
                  name="os"
                  id="os-input"
                  readOnly
                  value={container.data.properties.osType}
                />
              </FormControl>

              <PortsMappingField value={ports} onChange={() => {}} readOnly />

              <FormControl label="Public IP" inputId="public-ip">
                <Input
                  name="public-ip"
                  id="public-ip"
                  readOnly
                  value={container.data.properties.ipAddress.ip}
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
                  value={
                    container.data.properties.containers[0].properties.resources
                      .cpu
                  }
                />
              </FormControl>

              <FormControl label="Memory" inputId="cpu-input">
                <Input
                  name="memory"
                  id="memory-input"
                  type="number"
                  placeholder="1"
                  readOnly
                  value={
                    container.data.properties.containers[0].properties.resources
                      .memoryInGB
                  }
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
            resourceGroup.data.name,
            'containerGroups',
            container.data.name,
          ])
        }
        resourceId={id}
        resourceControl={
          container.data.Portainer?.ResourceControl
            ? new ResourceControlViewModel(
                container.data.Portainer?.ResourceControl
              )
            : undefined
        }
        resourceType={ResourceControlType.ContainerGroup}
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

export const ContainerInstanceViewAngular = r2a(ContainerInstanceView, []);
