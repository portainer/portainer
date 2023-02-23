import { IComponentOptions } from 'angular';

import controller from './git-form.controller';

export const gitForm: IComponentOptions = {
  template: `
<ng-form name="$ctrl.gitForm">
  <react-git-form 
    value="$ctrl.value"
    on-change="$ctrl.handleChange"
    is-docker-standalone="$ctrl.isDockerStandalone"
    deploy-method="$ctrl.deployMethod"
    is-additional-files-field-visible="$ctrl.isAdditionalFilesFieldVisible"
    is-auto-update-visible="$ctrl.isAutoUpdateVisible"
    is-force-pull-visible="$ctrl.isForcePullVisible"
    is-auth-explanation-visible="$ctrl.isAuthExplanationVisible"
    base-webhook-url="$ctrl.baseWebhookUrl"
    errors="$ctrl.errors">
  </react-git-form>
</ng-form>`,
  bindings: {
    value: '<',
    onChange: '<',
    isDockerStandalone: '<',
    deployMethod: '@',
    baseWebhookUrl: '@',
    isAdditionalFilesFieldVisible: '<',
    isAutoUpdateVisible: '<',
    isForcePullVisible: '<',
    isAuthExplanationVisible: '<',
  },
  controller,
};
