angular.module('ui').component('datatableSettings', {
  transclude: {
    columnSelector: '?datatableSettingColumnSelector'
  },
  templateUrl: 'app/directives/ui/datatable/datatable-settings/datatableSettings.html',
  controller: function() {
    this.state = {
      isOpen: false
    };

    this.closeSettings = function() {
      this.state.isOpen = false;
    };
  }
});
