angular
  .module('portainer.docker')
  .controller('NodeAvailabilitySelectController', [
    function NodeAvailabilitySelectController() {
      this.state = {
        hasChanges: false
      };
      this.onChange = onChange;
      this.save = save;
      this.cancelChanges = cancelChanges;

      function onChange() {
        this.state.hasChanges = this.originalValue !== this.availability;
      }

      function save() {
        this.onSave({ availability: this.availability });
      }

      function cancelChanges() {
        this.state.hasChanges = false;
        this.availability = this.originalValue;
      }

      
    }
  ]);
