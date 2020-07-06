import angular from 'angular';

export class EdgeGroupsDatatableController {
  constructor($scope, $controller) {
    const allowSelection = this.allowSelection;
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));
    this.allowSelection = allowSelection.bind(this);
  }

  /**
   * Override this method to allow/deny selection
   */
  allowSelection(item) {
    return !item.HasEdgeStack;
  }
}
