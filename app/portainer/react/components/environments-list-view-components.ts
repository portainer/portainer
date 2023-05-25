import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { ImportFdoDeviceButton } from '@/react/portainer/environments/ListView/ImportFdoDeviceButton';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';

export const envListModule = angular
  .module('portainer.app.react.components.environments.list-view', [])
  .component(
    'importFdoDeviceButton',
    r2a(withUIRouter(withReactQuery(ImportFdoDeviceButton)), [])
  ).name;
