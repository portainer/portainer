import angular from 'angular';
import { ComponentProps } from 'react';

import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withFormValidation } from '@/react-tools/withFormValidation';
import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { ContainerNetworksDatatable } from '@/react/docker/containers/ItemView/ContainerNetworksDatatable';
import {
  CommandsTab,
  CommandsTabValues,
  commandsTabValidation,
} from '@/react/docker/containers/CreateView/CommandsTab';
import {
  EnvVarsTab,
  envVarsTabUtils,
} from '@/react/docker/containers/CreateView/EnvVarsTab';
import {
  VolumesTab,
  volumesTabUtils,
} from '@/react/docker/containers/CreateView/VolumesTab';
import {
  networkTabUtils,
  NetworkTab,
  type NetworkTabValues,
} from '@/react/docker/containers/CreateView/NetworkTab';
import {
  ResourcesTab,
  resourcesTabUtils,
  type ResourcesTabValues,
} from '@/react/docker/containers/CreateView/ResourcesTab';
import {
  CapabilitiesTab,
  capabilitiesTabUtils,
} from '@/react/docker/containers/CreateView/CapabilitiesTab';

const ngModule = angular
  .module('portainer.docker.react.components.containers', [])
  .component(
    'dockerContainerNetworksDatatable',
    r2a(withUIRouter(withCurrentUser(ContainerNetworksDatatable)), [
      'container',
      'dataset',
      'nodeName',
    ])
  );

export const containersModule = ngModule.name;

withFormValidation<ComponentProps<typeof CommandsTab>, CommandsTabValues>(
  ngModule,
  withUIRouter(withReactQuery(CommandsTab)),
  'dockerCreateContainerCommandsTab',
  ['apiVersion'],
  commandsTabValidation
);

withFormValidation(
  ngModule,
  withUIRouter(withReactQuery(EnvVarsTab)),
  'dockerCreateContainerEnvVarsTab',
  [],
  envVarsTabUtils.validation
);

withFormValidation(
  ngModule,
  withUIRouter(withReactQuery(VolumesTab)),
  'dockerCreateContainerVolumesTab',
  ['allowBindMounts'],
  volumesTabUtils.validation
);

withFormValidation<ComponentProps<typeof NetworkTab>, NetworkTabValues>(
  ngModule,
  withUIRouter(withReactQuery(NetworkTab)),
  'dockerCreateContainerNetworkTab',
  [],
  networkTabUtils.validation
);

withFormValidation<ComponentProps<typeof ResourcesTab>, ResourcesTabValues>(
  ngModule,
  withUIRouter(withReactQuery(ResourcesTab)),
  'dockerCreateContainerResourcesTab',
  [
    'allowPrivilegedMode',
    'isDevicesFieldVisible',
    'isInitFieldVisible',
    'isSysctlFieldVisible',
    'isDuplicate',
    'isImageInvalid',
    'redeploy',
  ],
  resourcesTabUtils.validation
);

withFormValidation(
  ngModule,
  CapabilitiesTab,
  'dockerCreateContainerCapabilitiesTab',
  [],
  capabilitiesTabUtils.validation
);
