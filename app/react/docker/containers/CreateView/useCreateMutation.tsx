import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  Environment,
  EnvironmentId,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import {
  Registry,
  RegistryId,
} from '@/react/portainer/registries/types/registry';
import { createWebhook } from '@/react/portainer/webhooks/createWebhook';
import { WebhookType } from '@/react/portainer/webhooks/types';
import {
  AccessControlFormData,
  ResourceControlResponse,
} from '@/react/portainer/access-control/types';
import { applyResourceControl } from '@/react/portainer/access-control/access-control.service';
import PortainerError from '@/portainer/error';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { pullImage } from '../../images/queries/usePullImageMutation';
import {
  removeContainer,
  renameContainer,
  startContainer,
  stopContainer,
} from '../containers.service';
import { PortainerResponse } from '../../types';
import { connectContainer } from '../../networks/queries/useConnectContainerMutation';
import { ContainerListViewModel } from '../types';
import { queryKeys } from '../queries/query-keys';
import { withAgentTargetHeader } from '../../proxy/queries/utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

import { CreateContainerRequest } from './types';
import { Values } from './useInitialValues';

interface ExtraNetwork {
  networkName: string;
  aliases: string[];
}

export function useCreateOrReplaceMutation() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();

  return useMutation(
    createOrReplace,
    mutationOptions(
      withError('Failed to create container'),
      withInvalidate(queryClient, [queryKeys.list(environmentId)])
    )
  );
}

interface CreateOptions {
  config: CreateContainerRequest;
  values: {
    name: Values['name'];
    imageName: string;
    accessControl: Values['accessControl'];
    nodeName?: Values['nodeName'];
    alwaysPull?: Values['alwaysPull'];
    enableWebhook?: Values['enableWebhook'];
  };
  registry?: Registry;
  environment: Environment;
}

interface ReplaceOptions extends CreateOptions {
  oldContainer: ContainerListViewModel;
  extraNetworks: Array<ExtraNetwork>;
}

function isReplace(
  options: ReplaceOptions | CreateOptions
): options is ReplaceOptions {
  return 'oldContainer' in options && !!options.oldContainer;
}

export function createOrReplace(options: ReplaceOptions | CreateOptions) {
  return isReplace(options) ? replace(options) : create(options);
}

async function create({
  config,
  values,
  registry,
  environment,
}: CreateOptions) {
  await pullImageIfNeeded(
    environment.Id,
    values.alwaysPull || false,
    values.imageName,
    values.nodeName,
    registry
  );

  const containerResponse = await createAndStart(
    environment.Id,
    config,
    values.name,
    values.nodeName
  );

  await applyContainerSettings(
    containerResponse.Id,
    environment,
    values.accessControl,
    values.enableWebhook,
    containerResponse.Portainer?.ResourceControl,
    registry
  );
}

async function replace({
  oldContainer,
  config,
  values,
  registry,
  environment,
  extraNetworks,
}: ReplaceOptions) {
  await pullImageIfNeeded(
    environment.Id,
    values.alwaysPull || false,
    values.imageName,
    values.nodeName,
    registry
  );

  const containerResponse = await renameAndCreate(
    environment.Id,
    values.name,
    oldContainer,
    config,
    values.nodeName
  );

  await applyContainerSettings(
    containerResponse.Id,
    environment,
    values.accessControl,
    values.enableWebhook,
    containerResponse.Portainer?.ResourceControl,
    registry
  );

  await connectToExtraNetworks(
    environment.Id,
    containerResponse.Id,
    extraNetworks,
    values.nodeName
  );

  await removeContainer(environment.Id, oldContainer.Id, {
    nodeName: oldContainer.NodeName,
  });
}

/**
 * stop and renames the old container, and creates and stops the new container.
 * on any failure, it will rename the old container to its original name
 */
async function renameAndCreate(
  environmentId: EnvironmentId,
  name: string,
  oldContainer: ContainerListViewModel,
  config: CreateContainerRequest,
  nodeName?: string
) {
  let renamed = false;
  try {
    await stopContainerIfNeeded(
      environmentId,
      oldContainer,
      oldContainer.NodeName
    );

    await renameContainer(
      environmentId,
      oldContainer.Id,
      `${oldContainer.Names[0]}-old`,
      { nodeName: oldContainer.NodeName }
    );
    renamed = true;

    return await createAndStart(environmentId, config, name, nodeName);
  } catch (e) {
    if (renamed) {
      await renameContainer(environmentId, oldContainer.Id, name, {
        nodeName: oldContainer.NodeName,
      });
    }
    throw e;
  }
}

/**
 * creates a webhook if necessary and applies resource control
 */
async function applyContainerSettings(
  containerId: string,
  environment: Environment,
  accessControl: AccessControlFormData,
  enableWebhook?: boolean,
  resourceControl?: ResourceControlResponse,
  registry?: Registry
) {
  if (enableWebhook) {
    await createContainerWebhook(containerId, environment, registry?.Id);
  }

  // Portainer will always return a resource control, but since types mark it as optional, we need to check it.
  // Ignoring the missing value will result with bugs, hence it's better to throw an error
  if (!resourceControl) {
    throw new PortainerError('resource control expected after creation');
  }

  await applyResourceControl(accessControl, resourceControl.Id);
}

/**
 * creates a new container and starts it.
 * on failure, it will remove the new container
 */
async function createAndStart(
  environmentId: EnvironmentId,
  config: CreateContainerRequest,
  name?: string,
  nodeName?: string
) {
  let containerId = '';
  try {
    const containerResponse = await createContainer(
      environmentId,
      config,
      name,
      {
        nodeName,
      }
    );

    containerId = containerResponse.Id;

    await startContainer(environmentId, containerResponse.Id, { nodeName });
    return containerResponse;
  } catch (e) {
    if (containerId) {
      await removeContainer(environmentId, containerId, {
        nodeName,
      });
    }

    throw e;
  }
}

async function pullImageIfNeeded(
  environmentId: EnvironmentId,
  pull: boolean,
  image: string,
  nodeName?: string,
  registry?: Registry
) {
  if (!pull) {
    return null;
  }

  return pullImage({
    environmentId,
    nodeName,
    image,
    registry,
    ignoreErrors: true,
  });
}

async function createContainer(
  environmentId: EnvironmentId,
  config: CreateContainerRequest,
  name?: string,
  { nodeName }: { nodeName?: string } = {}
) {
  try {
    const { data } = await axios.post<
      PortainerResponse<{ Id: string; Warnings: Array<string> }>
    >(buildDockerProxyUrl(environmentId, 'containers', 'create'), config, {
      headers: { ...withAgentTargetHeader(nodeName) },
      params: { name },
    });

    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to create container');
  }
}

async function createContainerWebhook(
  containerId: string,
  environment: Environment,
  registryId?: RegistryId
) {
  const isNotEdgeAgentOnDockerEnvironment =
    environment.Type !== EnvironmentType.EdgeAgentOnDocker;
  if (!isNotEdgeAgentOnDockerEnvironment) {
    return;
  }

  await createWebhook({
    ResourceId: containerId,
    EndpointID: environment.Id,
    RegistryId: registryId,
    WebhookType: WebhookType.DockerContainer,
  });
}

function connectToExtraNetworks(
  environmentId: EnvironmentId,
  containerId: string,
  extraNetworks: Array<ExtraNetwork>,
  nodeName?: string
) {
  if (!extraNetworks) {
    return null;
  }

  return Promise.all(
    extraNetworks.map(({ networkName, aliases }) =>
      connectContainer({
        networkId: networkName,
        nodeName,
        containerId,
        environmentId,
        aliases,
      })
    )
  );
}

function stopContainerIfNeeded(
  environmentId: EnvironmentId,
  container: ContainerListViewModel,
  nodeName?: string
) {
  if (container.State !== 'running' || !container.Id) {
    return null;
  }
  return stopContainer(environmentId, container.Id, { nodeName });
}
