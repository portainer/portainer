angular
  .module('portainer.docker')
  .controller('SwarmNodeDetailsPanelController', [
    function SwarmNodeDetailsPanelController() {
      this.state = {
        managerAddress: ''
      };
      this.$onInit = initView;
      this.$onChanges = $onChanges;
      this.addLabel = addLabel;
      this.updateNodeLabels = updateNodeLabels;
      var managerRole = 'manager';

      function initView() {
        
      }

      function $onChanges() {
        if (!this.details) {
          return;
        }
        if (this.details.role === managerRole) {
          this.state.managerAddress =
            '(Manager address: ' + this.details.managerAddress + ')';
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
        this.onChangedLabels({labels: labels});
      }
    }
  ]);
