class CustomTemplatesDatatableController {
  /* @ngInject */
  constructor($scope, $controller) {
    const allowSelection = this.allowSelection;
    angular.extend(this, $controller('GenericDatatableController', { $scope: $scope }));
    this.allowSelection = allowSelection.bind(this);
  }

  /**
   * Override this method to allow/deny selection
   */
  allowSelection(item) {
    return this.isAdmin || item.createdByUserId === this.currentUserId;
  }
}

export default CustomTemplatesDatatableController;
