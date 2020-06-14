export default class UsersDatatableController {
  /* @ngInject*/
  constructor($controller, $scope) {
    const allowSelection = this.allowSelection;
    angular.extend(this, $controller('GenericDatatableController', { $scope }));
    this.allowSelection = allowSelection.bind(this);
  }

  /**
   * Override this method to allow/deny selection
   */
  allowSelection(item) {
    return item.Id !== 1;
  }
}
