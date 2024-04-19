interface GitlabProjectResponse {
  id: number;
  name: string;
  description: string;
  namespace?: {
    name: string;
  };
  path_with_namespace: string;
  container_registry_enabled: boolean;
}

export class RegistryGitlabProject {
  Id: number;

  Description: string;

  Name: string;

  Namespace: string;

  PathWithNamespace: string;

  RegistryEnabled: boolean;

  constructor(project: GitlabProjectResponse) {
    this.Id = project.id;
    this.Description = project.description;
    this.Name = project.name;
    this.Namespace = project.namespace ? project.namespace.name : '';
    this.PathWithNamespace = project.path_with_namespace;
    this.RegistryEnabled = project.container_registry_enabled;
  }
}
