angular.module('portainer.docker').controller('AMTDevicesDatatableController', [
  '$scope',
  '$controller',
  'OpenAMTService',
  'ModalService',
  'Notifications',
  function ($scope, $controller, OpenAMTService, ModalService, Notifications) {
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));

    this.state = Object.assign(this.state, {
      executingAction: false,
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
      }
    };

    this.executeDeviceAction = async function (deviceGUID, action) {
      try {
        const confirmed = await ModalService.confirmAsync({
          title: `Confirm`,
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
        console.log(`Execute ${action} on ${deviceGUID}`);
        this.state.executingAction = true;
        // TODO use correct endpointid
        await OpenAMTService.executeDeviceAction('22', deviceGUID, action);
        Notifications.success(`${action} action sent successfully`);
      } catch (err) {
        console.log(err);
        Notifications.error('Failure', err, `Failed to ${action} the device`);
      } finally {
        this.state.executingAction = false;
      }
    };

    this.$onInit = function () {
      this.setDefaults();
    };
  },
]);
