/* @ngInject */
export default function RegistryFormGitlab($scope) {
  this.selectedRegistries = [];

  this.onChangeRegistries = onChangeRegistries.bind(this);

  function onChangeRegistries(value) {
    $scope.$evalAsync(() => {
      this.selectedRegistries = value;
    });
  }
}
