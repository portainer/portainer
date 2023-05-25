import { IComponentOptions } from 'angular';

import controller from './git-form-auto-update-fieldset.controller';

export const gitFormAutoUpdate: IComponentOptions = {
  template: `<ng-form name="$ctrl.gitFormAutoUpdate">
    <react-git-form-auto-update-fieldset
    value="$ctrl.value"
    on-change="$ctrl.handleChange"
    environment-type="$ctrl.environmentType"
    is-force-pull-visible="$ctrl.isForcePullVisible"
    base-webhook-url="$ctrl.baseWebhookUrl"
    webhook-id="$ctrl.webhookId"
    webhooks-docs="$ctrl.webhooksDocs"
    errors="$ctrl.errors">
    </react-git-form-auto-update-fieldset>
  </ng-form>`,
  bindings: {
    value: '<',
    onChange: '<',
    environmentType: '@',
    isForcePullVisible: '<',
    baseWebhookUrl: '@',
    webhookId: '@',
    webhooksDocs: '@',
  },
  controller,
};
