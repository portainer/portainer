export default class searchUIModel {
    constructor(data) {
      this.label = data.Label;
      this.group = data.Type;
      this.value = "";
      this.envName = data.Environment;
      this.envType = data.EnvironmentType;
      this.envId = data.EnvironmentID;
      this.resourceId = data.ResourceID;
    }
  }