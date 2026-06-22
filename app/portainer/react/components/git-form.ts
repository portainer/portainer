import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { GitForm } from '@/react/portainer/gitops/GitForm';

export const gitFormModule = angular
  .module('portainer.app.components.forms.git', [])
  .component(
    'reactGitForm',
    r2a(withUIRouter(withReactQuery(withCurrentUser(GitForm))), [
      'value',
      'onChange',
      'environmentType',
      'isDockerStandalone',
      'deployMethod',
      'isAdditionalFilesFieldVisible',
      'isForcePullVisible',
      'errors',
      'baseWebhookUrl',
      'webhookId',
      'webhooksDocs',
      'isAutoUpdateVisible',
    ])
  ).name;
