angular.module('portainer.docker').controller('AMTDevicesDatatableController', [
  '$scope',
  '$state',
  '$controller',
  'OpenAMTService',
  'ModalService',
  'Notifications',
  function ($scope, $state, $controller, OpenAMTService, ModalService, Notifications) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope, $state: $state }));

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

    this.executeDeviceAction = async function (deviceGUID, action) {
      try {
        console.log(this.endpointId);
        console.log(`Execute ${action} on ${deviceGUID} ${this.endpointId}`);
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
        this.state.executingAction[deviceGUID] = true;

        await OpenAMTService.executeDeviceAction(this.endpointId, deviceGUID, action);
        Notifications.success(`${action} action sent successfully`);
        $state.reload();
      } catch (err) {
        console.log(err);
        Notifications.error('Failure', err, `Failed to ${action} the device`);
      } finally {
        this.state.executingAction[deviceGUID] = false;
      }
    };

    this.kvmAction = async function (device) {
      try {
        if (device.features['KVM'] && device.features['userConsent'] === 'none') {
          $state.go('portainer.endpoints.endpoint.kvm', {
            id: this.endpointId,
            deviceId: device.guid,
            deviceName: device.hostname,
          });
          return;
        }

        const featuresPayload = {
          IDER: true,
          KVM: true,
          SOL: true,
          redirection: true,
          userConsent: 'none',
        };
        await OpenAMTService.enableDeviceFeatures(this.endpointId, device.guid, featuresPayload);
        $state.go('portainer.endpoints.endpoint.kvm', {
          id: this.endpointId,
          deviceId: device.guid,
          deviceName: device.hostname,
        });
      } catch (err) {
        console.log(err);
        Notifications.error('Failure', err, `Failed to load kvm for device`);
      }
    };

    this.$onInit = function () {
      this.setDefaults();
    };
  },
]);
