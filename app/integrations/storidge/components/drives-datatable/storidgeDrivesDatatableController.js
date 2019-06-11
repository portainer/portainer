angular.module('portainer.docker')
  .controller('StoridgeDrivesDatatableController', ['$scope', '$controller',
    function ($scope, $controller) {
      angular.extend(this, $controller('GenericDatatableController', {$scope: $scope}));

      this.selectAll = function() {
        for (var i = 0; i < this.state.filteredDataSet.length; i++) {
          var item = this.state.filteredDataSet[i];
          if (item.Status !== 'normal' && item.Checked !== this.state.selectAll) {
            item.Checked = this.state.selectAll;
            this.selectItem(item);
          }
        }
      };
  }
]);