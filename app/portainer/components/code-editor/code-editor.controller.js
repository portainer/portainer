/* @ngInject */
export default function CodeEditorController($scope) {
  this.type = '';

  this.handleChange = (value) => {
    $scope.$evalAsync(() => {
      this.onChange(value);
    });
  };

  this.$onInit = () => {
    this.type = getType({ yaml: this.yml, dockerFile: this.dockerFile, shell: this.shell });
  };
}

function getType({ yaml, dockerFile, shell }) {
  if (yaml) {
    return 'yaml';
  }
  if (dockerFile) {
    return 'dockerfile';
  }
  if (shell) {
    return 'shell';
  }
  return undefined;
}
