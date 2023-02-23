/* @ngInject */
export default function CodeEditorController($scope) {
  this.handleChange = (value) => {
    $scope.$evalAsync(() => {
      this.onChange(value);
    });
  };
}
