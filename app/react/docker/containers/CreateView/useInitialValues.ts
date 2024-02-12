import { useCurrentStateAndParams } from '@uirouter/react';

import {
  BaseFormValues,
  baseFormUtils,
} from '@/react/docker/containers/CreateView/BaseForm';
import {
  CapabilitiesTabValues,
  capabilitiesTabUtils,
} from '@/react/docker/containers/CreateView/CapabilitiesTab';
import {
  CommandsTabValues,
  commandsTabUtils,
} from '@/react/docker/containers/CreateView/CommandsTab';
import {
  LabelsTabValues,
  labelsTabUtils,
} from '@/react/docker/containers/CreateView/LabelsTab';
import {
  NetworkTabValues,
  networkTabUtils,
} from '@/react/docker/containers/CreateView/NetworkTab';
import {
  ResourcesTabValues,
  resourcesTabUtils,
} from '@/react/docker/containers/CreateView/ResourcesTab';
import {
  RestartPolicy,
  restartPolicyTabUtils,
} from '@/react/docker/containers/CreateView/RestartPolicyTab';
import {
  VolumesTabValues,
  volumesTabUtils,
} from '@/react/docker/containers/CreateView/VolumesTab';
import { envVarsTabUtils } from '@/react/docker/containers/CreateView/EnvVarsTab';
import { UserId } from '@/portainer/users/types';
import { getImageConfig } from '@/react/portainer/registries/utils/getImageConfig';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useCurrentUser } from '@/react/hooks/useUser';
import { useWebhooks } from '@/react/portainer/webhooks/useWebhooks';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';

import { EnvVarValues } from '@@/form-components/EnvironmentVariablesFieldset';

import { useNetworksForSelector } from '../components/NetworkSelector';
import { useContainers } from '../queries/containers';
import { useContainer } from '../queries/container';

export interface Values extends BaseFormValues {
  commands: CommandsTabValues;
  volumes: VolumesTabValues;
  network: NetworkTabValues;
  labels: LabelsTabValues;
  restartPolicy: RestartPolicy;
  resources: ResourcesTabValues;
  capabilities: CapabilitiesTabValues;
  env: EnvVarValues;
}

export function useInitialValues(submitting: boolean) {
  const {
    params: { nodeName, from },
  } = useCurrentStateAndParams();
  const environmentId = useEnvironmentId();
  const { isAdmin, user } = useCurrentUser();
  const networksQuery = useNetworksForSelector();

  const fromContainerQuery = useContainer(environmentId, from, {
    enabled: !submitting,
  });
  const runningContainersQuery = useContainers(environmentId, {
    enabled: !!from,
  });
  const webhookQuery = useWebhooks(
    { endpointId: environmentId, resourceId: from },
    { enabled: !!from }
  );
  const registriesQuery = useEnvironmentRegistries(environmentId, {
    enabled: !!from,
  });

  if (!networksQuery.data) {
    return null;
  }

  if (!from) {
    return {
      initialValues: defaultValues(isAdmin, user.Id, nodeName),
    };
  }

  const fromContainer = fromContainerQuery.data;
  if (
    !fromContainer ||
    !registriesQuery.data ||
    !runningContainersQuery.data ||
    !webhookQuery.data
  ) {
    return null;
  }

  const network = networkTabUtils.toViewModel(
    fromContainer,
    networksQuery.data,
    runningContainersQuery.data
  );

  const extraNetworks = Object.entries(
    fromContainer.NetworkSettings?.Networks || {}
  )
    .filter(([n]) => n !== network.networkMode)
    .map(([networkName, network]) => ({
      networkName,
      aliases: (network.Aliases || []).filter(
        (o) => !fromContainer.Id?.startsWith(o)
      ),
    }));

  const imageConfig = getImageConfig(
    fromContainer?.Config?.Image || '',
    registriesQuery.data
  );

  const initialValues: Values = {
    commands: commandsTabUtils.toViewModel(fromContainer),
    volumes: volumesTabUtils.toViewModel(fromContainer),
    network: networkTabUtils.toViewModel(
      fromContainer,
      networksQuery.data,
      runningContainersQuery.data
    ),
    labels: labelsTabUtils.toViewModel(fromContainer),
    restartPolicy: restartPolicyTabUtils.toViewModel(fromContainer),
    resources: resourcesTabUtils.toViewModel(fromContainer),
    capabilities: capabilitiesTabUtils.toViewModel(fromContainer),
    env: envVarsTabUtils.toViewModel(fromContainer),
    ...baseFormUtils.toViewModel(
      fromContainer,
      isAdmin,
      user.Id,
      nodeName,
      imageConfig,
      (webhookQuery.data?.length || 0) > 0
    ),
  };

  return { initialValues, isDuplicating: true, extraNetworks };
}

function defaultValues(
  isAdmin: boolean,
  currentUserId: UserId,
  nodeName: string
): Values {
  return {
    commands: commandsTabUtils.getDefaultViewModel(),
    volumes: volumesTabUtils.getDefaultViewModel(),
    network: networkTabUtils.getDefaultViewModel(),
    labels: labelsTabUtils.getDefaultViewModel(),
    restartPolicy: restartPolicyTabUtils.getDefaultViewModel(),
    resources: resourcesTabUtils.getDefaultViewModel(),
    capabilities: capabilitiesTabUtils.getDefaultViewModel(),
    env: envVarsTabUtils.getDefaultViewModel(),
    ...baseFormUtils.getDefaultViewModel(isAdmin, currentUserId, nodeName),
  };
}
