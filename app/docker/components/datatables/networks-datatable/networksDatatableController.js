angular.module('portainer.docker')
  .controller('NetworksDatatableController', ['$scope', '$controller',
    function ($scope, $controller) {
      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      var PREDEFINED_NETWORKS = ['host', 'bridge', 'none'];

      this.disableRemove = function(item) {
        return PREDEFINED_NETWORKS.includes(item.Name);
      };

      this.selectAll = function() {
        for (var i = 0; i < this.state.filteredDataSet.length; i++) {
          var item = this.state.filteredDataSet[i];
          if (!this.disableRemove(item) && item.Checked !== this.state.selectAll) {
            item.Checked = this.state.selectAll;
            this.selectItem(item);
          }
        }
      };
  }
]);