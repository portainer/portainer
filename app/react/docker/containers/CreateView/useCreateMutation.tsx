import { useMutation, useQueryClient } from 'react-query';
import { AxiosRequestHeaders } from 'axios';

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
  urlBuilder,
} from '../containers.service';
import { PortainerResponse } from '../../types';
import { connectContainer } from '../../networks/queries/useConnectContainer';
import { DockerContainer } from '../types';
import { queryKeys } from '../queries/query-keys';

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
  values: Values;
  registry?: Registry;
  environment: Environment;
}

interface ReplaceOptions extends CreateOptions {
  oldContainer: DockerContainer;
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
    values.nodeName,
    values.alwaysPull,
    values.image.image,
    registry
  );

  const containerResponse = await createAndStart(
    environment,
    config,
    values.name,
    values.nodeName
  );

  await applyContainerSettings(
    containerResponse.Id,
    environment,
    values.enableWebhook,
    values.accessControl,
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
    values.nodeName,
    values.alwaysPull,
    values.image.image,
    registry
  );

  const containerResponse = await renameAndCreate(
    environment,
    values,
    oldContainer,
    config
  );

  await applyContainerSettings(
    containerResponse.Id,
    environment,
    values.enableWebhook,
    values.accessControl,
    containerResponse.Portainer?.ResourceControl,
    registry
  );

  await connectToExtraNetworks(
    environment.Id,
    values.nodeName,
    containerResponse.Id,
    extraNetworks
  );

  await removeContainer(environment.Id, oldContainer.Id, {
    nodeName: values.nodeName,
  });
}

/**
 * stop and renames the old container, and creates and stops the new container.
 * on any failure, it will rename the old container to its original name
 */
async function renameAndCreate(
  environment: Environment,
  values: Values,
  oldContainer: DockerContainer,
  config: CreateContainerRequest
) {
  let renamed = false;
  try {
    await stopContainerIfNeeded(environment.Id, values.nodeName, oldContainer);

    await renameContainer(
      environment.Id,
      oldContainer.Id,
      `${oldContainer.Names[0]}-old`,
      { nodeName: values.nodeName }
    );
    renamed = true;

    return await createAndStart(
      environment,
      config,
      values.name,
      values.nodeName
    );
  } catch (e) {
    if (renamed) {
      await renameContainer(environment.Id, oldContainer.Id, values.name, {
        nodeName: values.nodeName,
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
  enableWebhook: boolean,
  accessControl: AccessControlFormData,
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
  environment: Environment,
  config: CreateContainerRequest,
  name: string,
  nodeName: string
) {
  let containerId = '';
  try {
    const containerResponse = await createContainer(
      environment.Id,
      config,
      name,
      {
        nodeName,
      }
    );

    containerId = containerResponse.Id;

    await startContainer(environment.Id, containerResponse.Id, { nodeName });
    return containerResponse;
  } catch (e) {
    if (containerId) {
      await removeContainer(environment.Id, containerId, {
        nodeName,
      });
    }

    throw e;
  }
}

async function pullImageIfNeeded(
  environmentId: EnvironmentId,
  nodeName: string,
  pull: boolean,
  image: string,
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
    const headers: AxiosRequestHeaders = {};

    if (nodeName) {
      headers['X-PortainerAgent-Target'] = nodeName;
    }

    const { data } = await axios.post<
      PortainerResponse<{ Id: string; Warnings: Array<string> }>
    >(urlBuilder(environmentId, undefined, 'create'), config, {
      headers,
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
  nodeName: string,
  containerId: string,
  extraNetworks: Array<ExtraNetwork>
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
  nodeName: string,
  container: DockerContainer
) {
  if (container.State !== 'running' || !container.Id) {
    return null;
  }
  return stopContainer(environmentId, container.Id, { nodeName });
}
