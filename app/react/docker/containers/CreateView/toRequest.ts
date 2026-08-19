import { Registry } from '@/react/portainer/registries/types/registry';
import { buildImageFullURI } from '@/react/docker/images/utils';

import { baseFormUtils } from './BaseForm';
import { capabilitiesTabUtils } from './CapabilitiesTab';
import { commandsTabUtils } from './CommandsTab';
import { labelsTabUtils } from './LabelsTab';
import { networkTabUtils } from './NetworkTab';
import { resourcesTabUtils } from './ResourcesTab';
import { volumesTabUtils } from './VolumesTab';
import { CreateContainerRequest } from './types';
import { restartPolicyTabUtils } from './RestartPolicyTab';
import { envVarsTabUtils } from './EnvVarsTab';
import { Values } from './useInitialValues';

export function toRequest(
  values: Values,
  registry?: Registry,
  ignoreCapabilities?: boolean
) {
  let config: CreateContainerRequest = {
    HostConfig: {},
    NetworkingConfig: {},
  };

  config = commandsTabUtils.toRequest(config, values.commands);
  config = volumesTabUtils.toRequest(config, values.volumes);
  config = networkTabUtils.toRequest(config, values.network, '');
  config = labelsTabUtils.toRequest(config, values.labels);
  config = restartPolicyTabUtils.toRequest(config, values.restartPolicy);
  config = resourcesTabUtils.toRequest(config, values.resources);
  config = capabilitiesTabUtils.toRequest(
    config,
    values.capabilities,
    !!ignoreCapabilities
  );
  config = baseFormUtils.toRequest(config, values);
  config = envVarsTabUtils.toRequest(config, values.env);
  config.Image = buildImageFullURI(values.image.image, registry);

  return config;
}
