angular.module('portainer.docker')
  .controller('NetworksDatatableController', ['$scope', '$controller', 'PREDEFINED_NETWORKS',
    function ($scope, $controller, PREDEFINED_NETWORKS) {
      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

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