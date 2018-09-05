angular
  .module('portainer.docker')
  .controller('SwarmNodeDetailsPanelController', [
    function SwarmNodeDetailsPanelController() {
      this.$onInit = initView;
      this.state = {
        managerAddress: ''
      };

      var managerRole = 'manager';

      function initView() {
        if (this.details.role === managerRole) {
          this.state.managerAddress =
            '(Manager address: ' + this.details.managerAddress + ')';
        }
      }
    }
  ]);
