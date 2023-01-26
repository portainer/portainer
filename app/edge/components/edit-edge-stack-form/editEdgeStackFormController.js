import { PortainerEndpointTypes } from '@/portainer/models/endpoint/models';
import { EditorType } from '@/react/edge/edge-stacks/types';
import { getValidEditorTypes } from '@/react/edge/edge-stacks/utils';
export class EditEdgeStackFormController {
  /* @ngInject */
  constructor($scope) {
    this.$scope = $scope;
    this.state = {
      endpointTypes: [],
    };

    this.fileContents = {
      0: '',
      1: '',
    };

    this.EditorType = EditorType;

    this.onChangeGroups = this.onChangeGroups.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onChangeComposeConfig = this.onChangeComposeConfig.bind(this);
    this.onChangeKubeManifest = this.onChangeKubeManifest.bind(this);
    this.hasDockerEndpoint = this.hasDockerEndpoint.bind(this);
    this.hasKubeEndpoint = this.hasKubeEndpoint.bind(this);
    this.onChangeDeploymentType = this.onChangeDeploymentType.bind(this);
    this.removeLineBreaks = this.removeLineBreaks.bind(this);
    this.onChangeFileContent = this.onChangeFileContent.bind(this);
    this.onChangeUseManifestNamespaces = this.onChangeUseManifestNamespaces.bind(this);
  }

  onChangeUseManifestNamespaces(value) {
    this.$scope.$evalAsync(() => {
      this.model.UseManifestNamespaces = value;
    });
  }

  hasKubeEndpoint() {
    return this.state.endpointTypes.includes(PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment);
  }

  hasDockerEndpoint() {
    return this.state.endpointTypes.includes(PortainerEndpointTypes.EdgeAgentOnDockerEnvironment);
  }

  onChangeGroups(groups) {
    return this.$scope.$evalAsync(() => {
      this.model.EdgeGroups = groups;

      this.checkEndpointTypes(groups);
    });
  }

  isFormValid() {
    return this.model.EdgeGroups.length && this.model.StackFileContent && this.validateEndpointsForDeployment();
  }

  checkEndpointTypes(groups) {
    const edgeGroups = groups.map((id) => this.edgeGroups.find((e) => e.Id === id));
    this.state.endpointTypes = edgeGroups.flatMap((group) => group.EndpointTypes);
    this.selectValidDeploymentType();
  }

  selectValidDeploymentType() {
    const validTypes = getValidEditorTypes(this.state.endpointTypes);

    if (!validTypes.includes(this.model.DeploymentType)) {
      this.onChangeDeploymentType(validTypes[0]);
    }
  }

  removeLineBreaks(value) {
    return value.replace(/(\r\n|\n|\r)/gm, '');
  }

  onChangeFileContent(type, value) {
    const oldValue = this.fileContents[type];
    if (this.removeLineBreaks(oldValue) !== this.removeLineBreaks(value)) {
      this.model.StackFileContent = value;
      this.fileContents[type] = value;
      this.isEditorDirty = true;
    }
  }

  onChangeKubeManifest(value) {
    this.onChangeFileContent(1, value);
  }

  onChangeComposeConfig(value) {
    this.onChangeFileContent(0, value);
  }

  onChangeDeploymentType(deploymentType) {
    return this.$scope.$evalAsync(() => {
      this.model.DeploymentType = deploymentType;
      this.model.StackFileContent = this.fileContents[deploymentType];
    });
  }

  validateEndpointsForDeployment() {
    return this.model.DeploymentType == 0 || !this.hasDockerEndpoint();
  }

  $onInit() {
    this.checkEndpointTypes(this.model.EdgeGroups);
    this.fileContents[this.model.DeploymentType] = this.model.StackFileContent;
  }
}
