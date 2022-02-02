import angular from 'angular';

import { configureFDO } from '@/portainer/hostmanagement/fdo/fdo.service';
import { configureAMT } from 'Portainer/hostmanagement/open-amt/open-amt.service';

angular.module('portainer.app').controller('SettingsEdgeComputeController', SettingsEdgeComputeController);

/* @ngInject */
export default function SettingsEdgeComputeController($q, $async, $state, Notifications, SettingsService, StateManager) {
  var ctrl = this;

  this.onSubmitEdgeCompute = async function (settings) {
    try {
      await SettingsService.update(settings);
      Notifications.success('Settings updated');
      StateManager.updateEnableEdgeComputeFeatures(settings.EnableEdgeComputeFeatures);
      $state.reload();
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to update settings');
    }
  };

  this.onSubmitOpenAMT = async function (formValues) {
    try {
      await configureAMT(formValues);
      Notifications.success(`OpenAMT successfully ${formValues.enabled ? 'enabled' : 'disabled'}`);
      $state.reload();
    } catch (err) {
      Notifications.error('Failure', err, 'Failed applying changes');
    }
  };

  this.onSubmitFDO = async function (formValues) {
    try {
      await configureFDO(formValues);
      Notifications.success(`FDO successfully ${formValues.enabled ? 'enabled' : 'disabled'}`);
      $state.reload();
    } catch (err) {
      Notifications.error('Failure', err, 'Failed applying changes');
    }
  };

  function initView() {
    $async(async () => {
      try {
        ctrl.settings = await SettingsService.settings();
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to retrieve application settings');
      }
    });
  }

  initView();
}
