import angular from 'angular';
import { ComponentProps } from 'react';

import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withFormValidation } from '@/react-tools/withFormValidation';
import {
  CommandsTab,
  CommandsTabValues,
  commandsTabValidation,
} from '@/react/docker/containers/CreateView/CommandsTab';
import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { ContainerNetworksDatatable } from '@/react/docker/containers/ItemView/ContainerNetworksDatatable';

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
