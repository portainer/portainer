import angular from 'angular';

import { r2a } from '@/react-tools/react2angular';
import { withCurrentUser } from '@/react-tools/withCurrentUser';
import { withReactQuery } from '@/react-tools/withReactQuery';
import { withUIRouter } from '@/react-tools/withUIRouter';
import { AutoUpdateFieldset } from '@/react/portainer/gitops/AutoUpdateFieldset';
import { GitForm } from '@/react/portainer/gitops/GitForm';
import { AuthFieldset } from '@/react/portainer/gitops/AuthFieldset';
import { InfoPanel } from '@/react/portainer/gitops/InfoPanel';
import { RefField } from '@/react/portainer/gitops/RefField';

export const gitFormModule = angular
  .module('portainer.app.components.forms.git', [])
  .component(
    'reactGitForm',
    r2a(withUIRouter(withReactQuery(withCurrentUser(GitForm))), [
      'value',
      'onChange',
      'isDockerStandalone',
      'deployMethod',
      'isAdditionalFilesFieldVisible',
      'isForcePullVisible',
      'isAuthExplanationVisible',
      'errors',
      'baseWebhookUrl',
    ])
  )
  .component(
    'gitFormInfoPanel',
    r2a(InfoPanel, [
      'additionalFiles',
      'className',
      'configFilePath',
      'type',
      'url',
    ])
  )
  .component(
    'reactGitFormAutoUpdateFieldset',
    r2a(AutoUpdateFieldset, [
      'value',
      'onChange',
      'environmentType',
      'isForcePullVisible',
      'errors',
      'baseWebhookUrl',
    ])
  )
  .component(
    'reactGitFormAuthFieldset',
    r2a(withUIRouter(withReactQuery(withCurrentUser(AuthFieldset))), [
      'value',
      'isExplanationVisible',
      'onChange',
      'errors',
    ])
  )
  .component(
    'reactGitFormRefField',
    r2a(withUIRouter(withReactQuery(withCurrentUser(RefField))), [
      'error',
      'model',
      'onChange',
      'stackId',
      'value',
      'isUrlValid',
    ])
  ).name;
