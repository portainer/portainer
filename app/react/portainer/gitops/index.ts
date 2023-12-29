import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { RelativePathFieldset } from '@/react/portainer/gitops/RelativePathFieldset/RelativePathFieldset';

export const ngModule = angular
  .module('portainer.app.react.gitops', [])

  .component(
    'relativePathFieldset',
    r2a(withUIRouter(withReactQuery(RelativePathFieldset)), [
      'value',
      'gitModel',
      'onChange',
      'isEditing',
      'hideEdgeConfigs',
    ])
  );

export const gitopsModule = ngModule.name;
