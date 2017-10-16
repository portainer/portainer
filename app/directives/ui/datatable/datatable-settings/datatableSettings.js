angular.module('ui').component('datatableSettings', {
  templateUrl: 'app/ui/components/datatable/datatable-settings/datatableSettings.html',
  controller: function() {
    this.state = {
      isOpen: false
    };

    this.closeSettings = function() {
      this.state.isOpen = false;
    };
  },
  bindings: {
    headers: '=',
    onColumnSelection: '&'
  }
});
