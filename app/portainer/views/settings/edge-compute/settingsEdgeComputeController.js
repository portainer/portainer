import _ from 'lodash-es';
import angular from 'angular';

import { configureAMT } from 'Portainer/hostmanagement/open-amt/open-amt.service';

angular.module('portainer.app').controller('SettingsEdgeComputeController', SettingsEdgeComputeController);

/* @ngInject */
export default function SettingsEdgeComputeController($q, $async, $state, Notifications, SettingsService, StateManager) {
  var ctrl = this;

  this.onSubmitEdgeCompute = async function (settings) {
    try {
      await SettingsService.update(settings);
      Notifications.success('Success', 'Settings updated');
      StateManager.updateEnableEdgeComputeFeatures(settings.EnableEdgeComputeFeatures);
      $state.reload();
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to update settings');
    }
  };

  this.onSubmitOpenAMT = async function (formValues) {
    try {
      await configureAMT(formValues);
      Notifications.success('Success', `OpenAMT successfully ${formValues.enabled ? 'enabled' : 'disabled'}`);
      $state.reload();
    } catch (err) {
      Notifications.error('Failure', err, 'Failed applying changes');
    }
  };

  function initView() {
    $async(async () => {
      try {
        const settings = await SettingsService.settings();

        const defaultMTLS = {
          ..._.get(settings, 'Edge.MTLS', {}),
          UseSeparateCert: _.get(settings, 'Edge.MTLS.UseSeparateCert', false),
        };

        ctrl.settings = {
          ...settings,
          EnableEdgeComputeFeatures: !!settings.EnableEdgeComputeFeatures,
          EnforceEdgeID: !!settings.EnforceEdgeID,
          Edge: {
            ...settings.Edge,
            MTLS: defaultMTLS,
          },
        };
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to retrieve application settings');
      }
    });
  }

  initView();
}
