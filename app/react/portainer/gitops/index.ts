import angular from 'angular';

import { withUIRouter } from '@/react-tools/withUIRouter';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { RelativePathFieldset } from '@/react/portainer/gitops/RelativePathFieldset/RelativePathFieldset';
import { withFormValidation } from '@/react-tools/withFormValidation';

import { relativePathValidation } from './RelativePathFieldset/validation';

export const ngModule = angular.module('portainer.app.react.gitops', []);

withFormValidation(
  ngModule,
  withUIRouter(withReactQuery(RelativePathFieldset)),
  'relativePathFieldset',
  ['gitModel', 'hideEdgeConfigs', 'isEditing', 'onChange'],
  relativePathValidation
);

export const gitopsModule = ngModule.name;
