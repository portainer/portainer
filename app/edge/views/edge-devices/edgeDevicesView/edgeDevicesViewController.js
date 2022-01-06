angular.module('portainer.edge').controller('EdgeDevicesViewController', EdgeDevicesViewController);

/* @ngInject */
export function EdgeDevicesViewController($async, EndpointService, SettingsService, ModalService, Notifications) {
  console.log("EdgeDevicesViewController");
  var ctrl = this;

  this.getEnvironments = function() {
      console.log("getEnvironments triggered");
      return $async(async () => {
          EndpointService.endpoints()
              .then(function success(data) {
                  ctrl.edgeDevices = data.value;
                  console.log(data.value);
              })
              .catch(function error(err) {
                  Notifications.error('Failure', err, 'Unable to retrieve edge devices');
                  ctrl.edgeDevices = [];
              });
      })
  }

    this.getSettings = function() {
        console.log("getSettings triggered");
        return $async(async () => {
            try {
                const settings = await SettingsService.settings();
                console.log(settings)

                const openAMTFeatureFlagValue = settings && settings.FeatureFlagSettings && settings.FeatureFlagSettings['open-amt'];
                const openAMTFeatureEnabled = settings && settings.EnableEdgeComputeFeatures && settings.openAMTConfiguration && settings.openAMTConfiguration.enabled;
                ctrl.isOpenAMTEnabled = openAMTFeatureFlagValue && openAMTFeatureEnabled;

                const fdoFeatureFlagValue = settings && settings.FeatureFlagSettings && settings.FeatureFlagSettings['fdo'];
                const fdoFeatureEnabled = settings && settings.EnableEdgeComputeFeatures && settings.fdoConfiguration && settings.fdoConfiguration.enabled;
                ctrl.isFDOEnabled = fdoFeatureFlagValue && fdoFeatureEnabled;
            } catch (err) {
                Notifications.error('Failure', err, 'Unable to retrieve settings');
            }
        })
    }

    this.setLoadingMessage = function(message) {
        return $async(async () => {
            ctrl.loadingMessage = message;
        })
    }

  function initView() {
      ctrl.getEnvironments();
      ctrl.getSettings();
  }

  initView();
}