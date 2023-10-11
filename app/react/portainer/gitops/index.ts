import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { PathSelector } from '@/react/portainer/gitops/ComposePathField/PathSelector';
import { RelativePathFieldset } from '@/react/portainer/gitops/RelativePathFieldset/RelativePathFieldset';

export const ngModule = angular
  .module('portainer.app.react.gitops', [])
  .component(
    'pathSelector',
    r2a(withUIRouter(withReactQuery(PathSelector)), [
      'value',
      'onChange',
      'placeholder',
      'model',
      'dirOnly',
      'readOnly',
    ])
  )
  .component(
    'relativePathFieldset',
    r2a(withUIRouter(withReactQuery(RelativePathFieldset)), [
      'value',
      'gitModel',
      'onChange',
      'readonly',
    ])
  );

export const gitopsModule = ngModule.name;
