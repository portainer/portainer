angular.module('uiv2').component('datatableSettings', {
  transclude: {
    filter: '?datatableFilter',
    columnSelector: '?datatableSettingColumnSelector'
  },
  templateUrl: 'app/directives/ui/datatablev2/datatable-settings/datatableSettings.html',
  controller: function() {
    this.state = {
      isOpen: false
    };

    this.closeSettings = function() {
      this.state.isOpen = false;
    };
  }
});
