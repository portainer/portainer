import { commandStringToArray } from '@/docker/helpers/containers';
import { parsePortBindingRequest } from '@/react/docker/containers/CreateView/BaseForm/PortsMappingField.requestModel';
import { volumesTabUtils } from '@/react/docker/containers/CreateView/VolumesTab';
import { CreateContainerRequest } from '@/react/docker/containers/CreateView/types';

import { TemplateViewModel } from '../../view-model';

import { FormValues } from './types';

export function createContainerConfiguration(
  template: TemplateViewModel,
  values: FormValues
): CreateContainerRequest {
  let configuration: CreateContainerRequest = {
    Env: [],
    OpenStdin: false,
    Tty: false,
    ExposedPorts: {},
    HostConfig: {
      RestartPolicy: {
        Name: 'no',
      },
      PortBindings: {},
      Binds: [],
      Privileged: false,
      ExtraHosts: [],
    },
    Volumes: {},
    Labels: {},
    NetworkingConfig: {},
  };

  configuration = volumesTabUtils.toRequest(configuration, values.volumes);

  configuration.HostConfig.NetworkMode = values.network;
  configuration.HostConfig.Privileged = template.Privileged;
  configuration.HostConfig.RestartPolicy = { Name: template.RestartPolicy };
  configuration.HostConfig.ExtraHosts = values.hosts ? values.hosts : [];
  configuration.Hostname = values.hostname;
  configuration.Env = Object.entries(values.envVars).map(
    ([name, value]) => `${name}=${value}`
  );
  configuration.Cmd = commandStringToArray(template.Command);
  const portBindings = parsePortBindingRequest(values.ports);
  configuration.HostConfig.PortBindings = portBindings;
  configuration.ExposedPorts = Object.fromEntries(
    Object.keys(portBindings).map((key) => [key, {}])
  );
  const consoleConfiguration = getConsoleConfiguration(template.Interactive);
  configuration.OpenStdin = consoleConfiguration.openStdin;
  configuration.Tty = consoleConfiguration.tty;
  configuration.Labels = Object.fromEntries(
    values.labels.filter((l) => !!l.name).map((l) => [l.name, l.value])
  );
  configuration.Image = template.RegistryModel.Image;
  return configuration;
}

function getConsoleConfiguration(interactiveFlag: boolean) {
  return {
    openStdin: interactiveFlag,
    tty: interactiveFlag,
  };
}
