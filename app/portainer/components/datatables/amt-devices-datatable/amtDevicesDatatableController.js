import { executeDeviceAction } from 'Portainer/hostmanagement/open-amt/open-amt.service';

angular.module('portainer.docker').controller('AMTDevicesDatatableController', [
  '$scope',
  '$async',
  '$state',
  '$controller',
  'ModalService',
  'Notifications',
  function ($scope, $async, $state, $controller, ModalService, Notifications) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope, $state: $state, $async: $async }));

    this.state = Object.assign(this.state, {
      executingAction: {},
    });

    this.parsePowerState = function (powerStateIntValue) {
      // https://app.swaggerhub.com/apis-docs/rbheopenamt/mps/1.4.0#/AMT/get_api_v1_amt_power_state__guid_
      switch (powerStateIntValue) {
        case 2:
          return 'Running';
        case 3:
        case 4:
          return 'Sleep';
        case 6:
        case 8:
        case 13:
          return 'Off';
        case 7:
          return 'Hibernate';
        case 9:
          return 'Power Cycle';
        default:
          return '-';
      }
    };

    this.executeDeviceActionConfirm = async function (device, action) {
      const deviceGUID = device.guid;
      if (!device.connectionStatus) {
        return;
      }
      try {
        const confirmed = await ModalService.confirmAsync({
          title: `Confirm action`,
          message: `Are you sure you want to ${action} the device?`,
          buttons: {
            confirm: {
              label: 'Confirm',
              className: 'btn-warning',
            },
          },
        });
        if (!confirmed) {
          return;
        }

        this.setExecutingAction(deviceGUID, true);
        await executeDeviceAction(this.endpointId, deviceGUID, action);
        Notifications.success(`${action} action sent successfully`);
        $state.reload();
      } catch (err) {
        console.log(err);
        Notifications.error('Failure', err, `Failed to ${action} the device`);
      } finally {
        this.setExecutingAction(deviceGUID, false);
      }
    };

    this.setExecutingAction = function(deviceGUID, isExecutingAction) {
      $async(async () => {
        this.state.executingAction[deviceGUID] = isExecutingAction;
      })
    }
    
    this.$onInit = function () {
      this.setDefaults();
    };
  },
]);
