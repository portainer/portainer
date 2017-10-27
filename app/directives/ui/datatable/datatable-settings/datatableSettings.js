angular.module('ui').component('datatableSettings', {
  transclude: {
    filter: '?datatableFilter',
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
