angular
  .module('portainer.docker')
  .controller('SwarmNodeDetailsPanelController', [
    function SwarmNodeDetailsPanelController() {
      this.state = {
        managerAddress: ''
      };
      this.$onChanges = $onChanges;
      this.addLabel = addLabel;
      this.updateNodeLabels = updateNodeLabels;
      this.updateNodeAvailability = updateNodeAvailability;
      var managerRole = 'manager';

      function $onChanges() {
        if (!this.details) {
          return;
        }
        if (this.details.role === managerRole) {
          this.state.managerAddress = '(' + this.details.managerAddress + ')';
        }
      }

      function addLabel() {
        this.details.nodeLabels.push({
          key: '',
          value: '',
          originalValue: '',
          originalKey: ''
        });
      }

      function updateNodeLabels(labels) {
        this.onChangedLabels({ labels: labels });
      }

      function updateNodeAvailability(availability) {
        this.onChangedAvailability({ availability: availability });
      }
    }
  ]);
