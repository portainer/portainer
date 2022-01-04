import angular from 'angular';

import { configureFDO } from "@/portainer/hostmanagement/fdo/fdo.service";
import { configureAMT } from "Portainer/hostmanagement/open-amt/open-amt.service";

angular.module('portainer.app').controller('SettingsEdgeComputeController', SettingsEdgeComputeController);

function SettingsEdgeComputeController($q, $scope, $state, Notifications, SettingsService, StateManager) {

  $scope.onSubmitEdgeCompute = function(settings) {
    SettingsService.update(settings)
        .then(function success() {
            Notifications.success('Settings updated');
            StateManager.updateEnableEdgeComputeFeatures(settings.EnableEdgeComputeFeatures);
            $state.reload();
        })
        .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to update settings');
        })
  }

    $scope.onSubmitOpenAMT = async function(formValues) {
      try {
          console.log("onSubmitOpenAMT");
        await configureAMT(formValues);
        Notifications.success(`OpenAMT successfully ${formValues.Enabled ? 'enabled' : 'disabled'}`);
        $state.reload();
      } catch (err) {
        Notifications.error('Failure', err, 'Failed applying changes');
      }
    }

    $scope.onSubmitFDO = async function(formValues) {
        try {
            console.log("onSubmitOpenFDO");
            await configureFDO(formValues);
            Notifications.success(`FDO successfully ${formValues.Enabled ? 'enabled' : 'disabled'}`);
            $state.reload();
        } catch (err) {
            Notifications.error('Failure', err, 'Failed applying changes');
        }
    }

  function initView() {
      SettingsService.settings()
      .then(function success(data) {
          $scope.settings = data;
      })
      .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
      });
  }

  initView();
}
