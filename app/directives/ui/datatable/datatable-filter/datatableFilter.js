angular.module('ui').component('datatableFilter', {
  require: {
    datatable: '^^datatable'
  },
  templateUrl: 'app/directives/ui/datatable/datatable-filter/datatableFilter.html',
  bindings: {
    property: '@',
    filters: '<'
  },
  controller: function() {
    var ctrl = this;
    this.updateFilter = function() {
      var filter = {};
      filter[ctrl.property] = this.filter;
      ctrl.datatable.updateFilter(filter);
    };
  }
});
