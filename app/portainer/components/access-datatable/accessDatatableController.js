angular.module('portainer.app')
  .controller('AccessDatatableController', ['$scope', '$controller',
    function ($scope, $controller) {
      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      this.disableRemove = function(item) {
        return item.Inherited;
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