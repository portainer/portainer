import { IComponentOptions } from 'angular';

import controller from './git-form.controller';

export const gitForm: IComponentOptions = {
  template: `
<ng-form name="$ctrl.gitForm">
  <react-git-form 
    value="$ctrl.value"
    on-change="$ctrl.handleChange"
    environment-type="$ctrl.environmentType"
    is-docker-standalone="$ctrl.isDockerStandalone"
    deploy-method="$ctrl.deployMethod"
    is-additional-files-field-visible="$ctrl.isAdditionalFilesFieldVisible"
    is-force-pull-visible="$ctrl.isForcePullVisible"
    is-auth-explanation-visible="$ctrl.isAuthExplanationVisible"
    base-webhook-url="$ctrl.baseWebhookUrl"
    webhook-id="$ctrl.webhookId"
    webhooks-docs="$ctrl.webhooksDocs"
    errors="$ctrl.errors">
  </react-git-form>
</ng-form>`,
  bindings: {
    value: '<',
    onChange: '<',
    environmentType: '@',
    isDockerStandalone: '<',
    deployMethod: '@',
    baseWebhookUrl: '@',
    isAdditionalFilesFieldVisible: '<',
    isForcePullVisible: '<',
    isAuthExplanationVisible: '<',
    webhookId: '@',
    webhooksDocs: '@',
  },
  controller,
};
